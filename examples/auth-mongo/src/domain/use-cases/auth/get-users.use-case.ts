import type { UserEntity } from "../../entities/user.entity.js";
import type { AuthRepository } from "../../repositories/auth.repository.js";


interface GetUsersUseCase {
    execute(): Promise<UserEntity[]>;
}


export class GetUsers implements GetUsersUseCase {

    constructor(
        private readonly authRepository: AuthRepository,
    ) {}

    execute(): Promise<UserEntity[]> {
        return this.authRepository.getUsers();
    }
}
