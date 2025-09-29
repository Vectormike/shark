import { Request, Response } from 'express';
import { db } from '../config/database';

// Paystack webhook handler
export const handlePaystackWebhook = async (req: Request, res: Response) => {
    try {
        const event = req.body;

        console.log('🔔 Paystack webhook received:', event.event);

        switch (event.event) {
            case 'transfer.success':
                await handleTransferSuccess(event.data);
                break;

            case 'transfer.failed':
                await handleTransferFailed(event.data);
                break;

            case 'transfer.reversed':
                await handleTransferReversed(event.data);
                break;

            default:
                console.log('📝 Unhandled webhook event:', event.event);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Handle successful transfer
async function handleTransferSuccess(data: any) {
    console.log('✅ Transfer successful:', data.reference);

    // Update loan status if needed
    // You could add additional logic here
}

// Handle failed transfer
async function handleTransferFailed(data: any) {
    console.log('❌ Transfer failed:', data.reference);

    // Revert loan status or handle failure
    // You could add failure handling logic here
}

// Handle reversed transfer
async function handleTransferReversed(data: any) {
    console.log('🔄 Transfer reversed:', data.reference);

    // Handle reversal logic
}
