import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException } from '@nestjs/common';
import { CreateUserCommand } from './create-user.command';
import { UserRepository } from '../../../infrastructure/repositories/user.repository';
import { BcryptService } from '../../../infrastructure/services/bcrypt.service';
import { User } from '@prisma/client';

@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler
  implements ICommandHandler<CreateUserCommand>
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const { email, password, firstName, lastName, organizationId, roleIds } =
      command;

    // Check if user already exists in this organization
    const existingUser = await this.userRepository.findByEmailAndOrganization(
      email,
      organizationId,
    );

    if (existingUser) {
      throw new ConflictException('User with this email already exists in the organization');
    }

    // Hash password
    const passwordHash = await this.bcryptService.hash(password);

    // Create user
    const user = await this.userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      organizationId,
      roleIds,
    });

    return user;
  }
}
