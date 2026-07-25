import { Request, Response } from 'express';
import * as userService from '../services/userService.js';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsersService();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const newUser = await userService.createUserService(email, name);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
};