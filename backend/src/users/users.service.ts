import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async findAll() {
    return this.userModel.find().select('-passwordHash').sort({ fullName: 1 });
  }

  async findById(id: string) {
    const user = await this.userModel
      .findById(id)
      .select('-passwordHash')
      .lean();
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ username: username.toLowerCase() })
      .select('+passwordHash');
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      const user = await this.userModel.create({
        fullName: dto.fullName,
        username: dto.username,
        passwordHash,
        role: dto.role,
      });
      return this.findById(user.id);
    } catch (error) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'That username already exists. Please use a different one.',
        );
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found.');
    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.password) user.passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      await user.save();
    } catch (error) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'That username already exists. Please use a different one.',
        );
      }
      throw error;
    }
    return this.findById(id);
  }
}
