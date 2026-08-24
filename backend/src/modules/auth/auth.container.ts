// ─── Dependency Injection Container ──────────────────────────────────────────
// Yahan dependencies wire hoti hain — service ko pata nahi kaunsa repository hai
// Dependency Inversion: dono interface pe depend karte hain, concrete class pe nahi

import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { IAuthRepository } from './auth.interface';

// Repository instance banao
const authRepository: IAuthRepository = new AuthRepository();

// Service mein repository inject karo (constructor injection)
const authService = new AuthService(authRepository);

// Controller mein service inject karo
const authController = new AuthController(authService);

// Sirf controller export karo — routes ko bas yahi chahiye
export { authController };