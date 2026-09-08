
// CAPA: Domain | TIPO: Puerto (function type)
//
// El reloj es una dependencia externa: leer la hora es I/O. La capa interna lo
// declara como este tipo y lo recibe inyectado; la implementación concreta
// (SystemClockAdapter) vive en infrastructure. Así un test puede fijar la hora
// sin tocar Date, y domain sigue sin importar nada de fuera.
export type Clock = () => Date;
