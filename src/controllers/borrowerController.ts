import { Request, Response } from 'express';
import { BorrowerService } from '../services/BorrowerService';

const borrowerService = new BorrowerService();

// Create a new borrower (admin only)
export const createBorrower = async (req: Request, res: Response) => {
	try {
		const borrowerData = {
			...req.body,
			created_by: req.user?.userId
		};

		const borrower = await borrowerService.createBorrower(borrowerData);

		res.status(201).json({
			success: true,
			message: 'Borrower created successfully',
			data: { borrower }
		});
	} catch (error) {
		console.error('Create borrower error:', error);
		res.status(400).json({
			success: false,
			message: error instanceof Error ? error.message : 'Internal server error'
		});
	}
};

// Get all borrowers (admin only)
export const getBorrowers = async (req: Request, res: Response) => {
	try {
		const { page = 1, limit = 20, search } = req.query;

		const result = await borrowerService.getBorrowers({
			page: Number(page),
			limit: Number(limit),
			search: search as string
		});

		res.json({
			success: true,
			data: result
		});
	} catch (error) {
		console.error('Get borrowers error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error'
		});
	}
};

// Get borrower by ID (admin only)
export const getBorrowerById = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const borrower = await borrowerService.getBorrowerById(id);

		res.json({
			success: true,
			data: { borrower }
		});
	} catch (error) {
		console.error('Get borrower by id error:', error);
		res.status(404).json({
			success: false,
			message: error instanceof Error ? error.message : 'Borrower not found'
		});
	}
};

// Update borrower (admin only)
export const updateBorrower = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const updates = req.body;

		const borrower = await borrowerService.updateBorrower(id, updates);

		res.json({
			success: true,
			message: 'Borrower updated successfully',
			data: { borrower }
		});
	} catch (error) {
		console.error('Update borrower error:', error);
		res.status(400).json({
			success: false,
			message: error instanceof Error ? error.message : 'Internal server error'
		});
	}
};

// Deactivate borrower (admin only)
export const deactivateBorrower = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { reason } = req.body;

		await borrowerService.deactivateBorrower(id, reason);

		res.json({
			success: true,
			message: 'Borrower deactivated successfully'
		});
	} catch (error) {
		console.error('Deactivate borrower error:', error);
		res.status(400).json({
			success: false,
			message: error instanceof Error ? error.message : 'Internal server error'
		});
	}
};

// Reactivate borrower (admin only)
export const reactivateBorrower = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const borrower = await borrowerService.reactivateBorrower(id);

		res.json({
			success: true,
			message: 'Borrower reactivated successfully',
			data: { borrower }
		});
	} catch (error) {
		console.error('Reactivate borrower error:', error);
		res.status(400).json({
			success: false,
			message: error instanceof Error ? error.message : 'Internal server error'
		});
	}
};
