import { LoanRepository } from "../repositories/LoanRepository";
import { BorrowerRepository } from "../repositories/BorrowerRepository";
import { Loan, LoanStatus, CreateLoanInput } from "../types/database";
import { CacheService, CacheKeys } from "../config/redis";
import { parseLoanFields, parseDecimalFieldsArray } from "../utils/sanitizer";
import { paymentService } from "./PaymentService";
import { BankService } from "./BankService";
import { getWhatsAppService } from "./WhatsAppService";
import { getNotificationService } from "./NotificationService";

export class LoanService {
  private loanRepository: LoanRepository;
  private borrowerRepository: BorrowerRepository;
  private whatsappService;
  private notificationService;

  constructor() {
    this.loanRepository = new LoanRepository();
    this.borrowerRepository = new BorrowerRepository();
    this.whatsappService = getWhatsAppService();
    this.notificationService = getNotificationService();
  }

  // Calculate loan details
  private calculateLoanDetails(
    amount: number,
    interestRate: number,
    termInMonths: number,
  ) {
    // Simple interest calculation (more common for personal loans)
    const totalInterest = (amount * interestRate) / 100;
    const totalAmount = amount + totalInterest;
    const monthlyPayment = totalAmount / termInMonths;
    const monthlyInterest = totalInterest / termInMonths;

    return {
      monthly_payment: Math.round(monthlyPayment * 100) / 100,
      total_amount: Math.round(totalAmount * 100) / 100,
      total_interest: Math.round(totalInterest * 100) / 100,
      monthly_interest: Math.round(monthlyInterest * 100) / 100,
      outstanding_balance: amount,
    };
  }

  // Create a new loan
  async createLoan(data: CreateLoanInput): Promise<Loan> {
    // Validate borrower exists
    const borrower = await this.borrowerRepository.findBorrowerById(
      data.borrower_id,
    );
    if (!borrower || !borrower.is_active) {
      throw new Error("Borrower not found or inactive");
    }

    // Calculate loan details
    const loanDetails = this.calculateLoanDetails(
      data.amount,
      data.interest_rate,
      data.term_in_months,
    );

    // Create loan
    const loan = await this.loanRepository.create({
      borrower_id: data.borrower_id,
      amount: data.amount,
      interest_rate: data.interest_rate,
      term_in_months: data.term_in_months,
      purpose: data.purpose,
      ...loanDetails,
      status: LoanStatus.PENDING,
    });

    // Clear borrower loans cache
    await CacheService.delete(CacheKeys.USER_LOANS(data.borrower_id));
    await CacheService.delete(CacheKeys.BORROWER_LOANS(data.borrower_id));

    // Send WhatsApp notification if borrower is on WhatsApp
    await this.sendLoanCreationNotification(borrower, loan);

    return parseLoanFields(loan);
  }

  // Get all loans with borrower information
  async getLoans(
    options: {
      page?: number;
      limit?: number;
      status?: string;
      borrower_id?: string;
    } = {},
  ): Promise<{
    loans: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const { page = 1, limit = 10, status, borrower_id } = options;

    const result = await this.loanRepository.findLoansWithBorrowers({
      page,
      limit,
      status,
      borrower_id,
    });

    return {
      loans: parseDecimalFieldsArray(result.data),
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    };
  }

  // Get loan by ID with borrower information
  async getLoanById(id: string): Promise<any> {
    // Try cache first
    const cachedLoan = await CacheService.get(CacheKeys.LOAN_DETAILS(id));
    if (cachedLoan) {
      return parseLoanFields(cachedLoan);
    }

    const loan = await this.loanRepository.findLoanWithBorrowerById(id);
    if (!loan) {
      throw new Error("Loan not found");
    }

    // Parse decimal fields
    const parsedLoan = parseLoanFields(loan);

    // Cache for 5 minutes
    await CacheService.set(CacheKeys.LOAN_DETAILS(id), parsedLoan, 300);

    return parsedLoan;
  }

  // Update loan
  async updateLoan(id: string, updates: Partial<Loan>): Promise<Loan> {
    // Check if loan exists
    const existingLoan = await this.loanRepository.findById(id);
    if (!existingLoan) {
      throw new Error("Loan not found");
    }

    // Only allow updates for pending loans
    if (existingLoan.status !== LoanStatus.PENDING) {
      throw new Error("Can only update pending loans");
    }

    // Recalculate loan details if amount, rate, or term changed
    if (updates.amount || updates.interest_rate || updates.term_in_months) {
      const loanDetails = this.calculateLoanDetails(
        updates.amount || existingLoan.amount,
        updates.interest_rate || existingLoan.interest_rate,
        updates.term_in_months || existingLoan.term_in_months,
      );
      Object.assign(updates, loanDetails);
    }

    const updatedLoan = await this.loanRepository.update(id, updates);
    if (!updatedLoan) {
      throw new Error("Failed to update loan");
    }

    // Clear cache
    await CacheService.delete(CacheKeys.LOAN_DETAILS(id));
    await CacheService.delete(CacheKeys.USER_LOANS(existingLoan.borrower_id));
    await CacheService.delete(
      CacheKeys.BORROWER_LOANS(existingLoan.borrower_id),
    );

    return updatedLoan;
  }

  // Delete loan
  async deleteLoan(id: string): Promise<void> {
    // Check if loan exists
    const existingLoan = await this.loanRepository.findById(id);
    if (!existingLoan) {
      throw new Error("Loan not found");
    }

    // Only allow deletion of pending loans
    if (existingLoan.status !== LoanStatus.PENDING) {
      throw new Error("Can only delete pending loans");
    }

    await this.loanRepository.delete(id);

    // Clear cache
    await CacheService.delete(CacheKeys.LOAN_DETAILS(id));
    await CacheService.delete(CacheKeys.USER_LOANS(existingLoan.borrower_id));
    await CacheService.delete(
      CacheKeys.BORROWER_LOANS(existingLoan.borrower_id),
    );
  }

  // Approve loan
  async approveLoan(id: string): Promise<Loan> {
    const loan = await this.loanRepository.updateStatus(
      id,
      LoanStatus.APPROVED,
    );
    if (!loan) {
      throw new Error("Loan not found");
    }

    await CacheService.delete(CacheKeys.LOAN_DETAILS(id));
    await CacheService.delete(CacheKeys.USER_LOANS(loan.borrower_id));
    await CacheService.delete(CacheKeys.BORROWER_LOANS(loan.borrower_id));

    return parseLoanFields(loan);
  }

  // Disburse loan with actual money transfer
  async disburseLoan(
    id: string,
    disbursementData: {
      bank_account: {
        account_number: string;
        bank_code?: string; // Optional - will be resolved from bank_name
        bank_name?: string; // Bank name to resolve bank_code
        account_name: string;
      };
      notes?: string;
    },
  ): Promise<Loan> {
    // Get loan details
    const loan = await this.loanRepository.findById(id);
    if (!loan) {
      throw new Error("Loan not found");
    }

    if (loan.status !== LoanStatus.APPROVED) {
      throw new Error("Only pending loans can be disbursed");
    }

    // Get borrower details
    const borrower = await this.borrowerRepository.findBorrowerById(
      loan.borrower_id,
    );
    if (!borrower) {
      throw new Error("Borrower not found");
    }

    // Validate bank account details
    const { account_number, bank_code, bank_name, account_name } =
      disbursementData.bank_account;

    if (!account_number || !account_name) {
      throw new Error(
        "Account number and account name are required for disbursement",
      );
    }

    if (!bank_code && !bank_name) {
      throw new Error(
        "Either bank_code or bank_name is required for disbursement",
      );
    }

    // Validate account number format
    if (!BankService.validateAccountNumber(account_number)) {
      throw new Error(
        "Invalid account number format. Nigerian account numbers must be 10 digits.",
      );
    }

    // Format account number (remove any non-digits)
    const formattedAccountNumber =
      BankService.formatAccountNumber(account_number);

    // Resolve bank code
    let resolvedBankCode = bank_code;

    if (!resolvedBankCode && bank_name) {
      // Resolve bank code from bank name using Paystack API
      try {
        const banks = await BankService.getSupportedBanks();
        const bank = banks.find(
          (b) =>
            b.name.toLowerCase().includes(bank_name.toLowerCase()) ||
            bank_name.toLowerCase().includes(b.name.toLowerCase()),
        );

        if (bank) {
          resolvedBankCode = bank.code;
          console.log(`✅ Resolved bank code: ${bank_name} -> ${bank.code}`);
        } else {
          throw new Error(
            `Bank not found: ${bank_name}. Please check the bank name or provide bank_code manually.`,
          );
        }
      } catch (error) {
        throw new Error(
          `Failed to resolve bank code for ${bank_name}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    // Validate resolved bank code
    if (!resolvedBankCode) {
      throw new Error(
        "Failed to resolve bank code. Please provide a valid bank_code or bank_name.",
      );
    }

    const isValidBankCode =
      await BankService.validateBankCode(resolvedBankCode);
    if (!isValidBankCode) {
      throw new Error(
        `Invalid bank code: ${resolvedBankCode}. Please use a valid Nigerian bank code.`,
      );
    }

    // Generate transfer reference
    const transferReference = `DISB_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    try {
      // Check if we're in development mode with simulated transfers
      const isDevelopment = process.env.NODE_ENV === "development";
      const simulateTransfers = process.env.SIMULATE_TRANSFERS === "true";

      let transferResult;

      if (isDevelopment && simulateTransfers) {
        // Simulate successful transfer for development
        console.log("🧪 DEVELOPMENT MODE: Simulating transfer...");
        transferResult = {
          success: true,
          transfer_code: `SIM_${Date.now()}`,
          reference: transferReference,
          status: "success",
          amount: loan.amount,
          recipient: {
            type: "bank",
            name: disbursementData.bank_account.account_name,
            account_number: formattedAccountNumber,
            bank_code: resolvedBankCode,
          },
        };
      } else {
        // Create actual transfer via payment gateway
        transferResult = await paymentService.createTransfer({
          amount: loan.amount,
          recipient_code: `${resolvedBankCode}_${formattedAccountNumber}`,
          reference: transferReference,
          reason:
            disbursementData.notes ||
            `Loan disbursement for ${borrower.first_name} ${borrower.last_name}`,
          currency: "NGN",
          account_name: disbursementData.bank_account.account_name,
        });

        if (!transferResult.success) {
          throw new Error(`Transfer failed: ${transferResult.status}`);
        }
      }

      // Update loan status to DISBURSED
      const updatedLoan = await this.loanRepository.updateStatus(
        id,
        LoanStatus.DISBURSED,
      );
      if (!updatedLoan) {
        throw new Error("Failed to update loan status");
      }

      // Clear cache
      await CacheService.delete(CacheKeys.LOAN_DETAILS(id));
      await CacheService.delete(CacheKeys.USER_LOANS(loan.borrower_id));
      await CacheService.delete(CacheKeys.BORROWER_LOANS(loan.borrower_id));

      // Log disbursement details
      console.log(`💰 Loan disbursed successfully:`, {
        loanId: id,
        amount: loan.amount,
        borrower: `${borrower.first_name} ${borrower.last_name}`,
        transferReference: transferResult.reference,
        transferCode: transferResult.transfer_code,
        status: transferResult.status,
      });

      return parseLoanFields(updatedLoan);
    } catch (error) {
      console.error("Disbursement failed:", error);
      throw new Error(
        `Disbursement failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Get loan statistics
  async getLoanStats(): Promise<any> {
    return await this.loanRepository.getLoanStats();
  }

  // Get loans by borrower
  async getLoansByBorrower(borrowerId: string): Promise<Loan[]> {
    return await this.loanRepository.findByBorrowerId(borrowerId);
  }

  private async sendLoanCreationNotification(
    borrower: any,
    loan: Loan,
  ): Promise<void> {
    try {
      // Send notification to borrower if they have a phone number
      if (borrower.phone) {
        const borrowerName =
          `${borrower.first_name} ${borrower.last_name}`.trim();

        const smsMessage = this.generateSMSLoanMessage(
          borrowerName,
          loan.amount,
          loan.id,
        );

        const smsResult = await this.notificationService.sendNotification({
          to: borrower.phone,
          message: smsMessage,
          type: "sms",
        });

        console.log("📱 SMS result:", smsResult);

        if (smsResult.success) {
          console.log(
            `✅ SMS notification sent to borrower: ${borrower.phone}`,
          );
        } else {
          console.log(
            `❌ SMS notification failed for borrower: ${smsResult.error}`,
          );
        }
      }

      // Send notification to admin (try WhatsApp first, then SMS)
      const adminPhone = process.env.ADMIN_PHONE;
      if (adminPhone) {
        const borrowerName =
          `${borrower.first_name} ${borrower.last_name}`.trim();

        // Try WhatsApp first
        const whatsappResult =
          await this.whatsappService.sendAdminLoanNotification(
            adminPhone,
            borrowerName,
            loan.amount,
            loan.id,
          );

        if (whatsappResult.success) {
          console.log(`💬 WhatsApp notification sent to admin: ${adminPhone}`);
        } else {
          console.log(
            `📱 WhatsApp notification failed for admin: ${whatsappResult.error}`,
          );

          // Send SMS as fallback
          console.log(`📲 Sending SMS fallback to admin: ${adminPhone}`);
          const adminSmsMessage = this.generateAdminSMSMessage(
            borrowerName,
            loan.amount,
            loan.id,
          );

          const smsResult = await this.notificationService.sendNotification({
            to: adminPhone,
            message: adminSmsMessage,
            type: "sms",
          });

          if (smsResult.success) {
            console.log(`✅ SMS notification sent to admin: ${adminPhone}`);
          } else {
            console.log(
              `❌ SMS notification failed for admin: ${smsResult.error}`,
            );
          }
        }
      }
    } catch (error) {
      console.error("❌ Error sending notification:", error);
    }
  }

  // Generate SMS message for borrower
  private generateSMSLoanMessage(
    borrowerName: string,
    amount: number,
    loanId: string,
  ): string {
    return `Hi ${borrowerName}! Your loan request of ₦${amount.toLocaleString()} has been approved and is being processed. Loan ID: ${loanId}. You will receive further updates shortly. Thank you for choosing our service!`;
  }

  // Generate SMS message for admin
  private generateAdminSMSMessage(
    borrowerName: string,
    amount: number,
    loanId: string,
  ): string {
    return `New loan approved for ${borrowerName}: ₦${amount.toLocaleString()} (ID: ${loanId}). Please review and process disbursement.`;
  }
}
