import { Response } from 'express';
import authService from '../services/auth.service';
import userRepository from '../repositories/user.repository';
import type { AuthRequest } from '../types/express.d';

export class AuthController {
  async register(req: AuthRequest, res: Response) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async login(req: AuthRequest, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: (error as Error).message });
    }
  }

  async logout(req: AuthRequest, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        await authService.logout(token);
      }
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async me(req: AuthRequest, res: Response) {
    res.json({ user: req.user });
  }

  async getUsers(req: AuthRequest, res: Response) {
    try {
      const users = await userRepository.findByClinic(req.user!.clinicId);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async createUser(req: AuthRequest, res: Response) {
    try {
      const user = await authService.createUser(req.user!.clinicId, req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async updateUser(req: AuthRequest, res: Response) {
    try {
      const user = await userRepository.update(req.params.id as string, req.body);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async deleteUser(req: AuthRequest, res: Response) {
    try {
      await userRepository.delete(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
}

export default new AuthController();
