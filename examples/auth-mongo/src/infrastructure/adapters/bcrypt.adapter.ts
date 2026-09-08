import { compareSync, genSaltSync, hashSync } from 'bcryptjs';


// Adaptador del patrón Adapter sobre bcryptjs.
// Encapsular la librería externa aquí permite reemplazarla (ej. argon2)
// sin tocar ningún otro archivo del proyecto.
export class BcryptAdapter {

    // genSaltSync genera una sal aleatoria. El número (10) indica las rondas de hashing:
    // más rondas = más seguro pero más lento. 10 es el valor recomendado para producción.
    static hashPassword(password: string): string {
        const salt = genSaltSync(10);
        return hashSync(password, salt);
    }

    // compareSync compara la contraseña en texto plano contra su hash almacenado.
    // Nunca se desencripta el hash; bcrypt re-hashea y compara internamente.
    static comparePassword( password: string, hashedPassword: string ): boolean {
        return compareSync(password, hashedPassword);
    }

}
