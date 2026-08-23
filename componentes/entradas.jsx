import { useState } from "react";
import "./css/Campo.css";
import { hoyISO } from "../src/formato";

/** Topes de captura, compartidos por todos los formularios. */
export const LIMITES = {
  nombres: 25,
  apellidos: 25,
  documento: 8,   // cédula venezolana sin el prefijo V-/E-
  telefono: 11,   // 0414 + 7 dígitos
  pin: 6,
};

/** Texto corriente con tope de caracteres. */
export function EntradaTexto({ value = "", onChange, maxLength, ...resto }) {
  return (
    <input
      {...resto}
      type="text"
      maxLength={maxLength}
      value={value ?? ""}
      onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
    />
  );
}

/**
 * Entradas que no dejan escribir lo que luego se va a rechazar.
 *
 * Validar sólo al enviar obliga al usuario a descubrir la regla equivocándose.
 * Estos controles filtran en el momento: en un campo numérico no entra una
 * letra, y en una fecha de un hecho ya ocurrido no se puede elegir mañana.
 */

/** Deja únicamente dígitos, venga de teclado, de un pegado o de autocompletar. */
export function EntradaDigitos({ value = "", onChange, maxLength, ...resto }) {
  const limpiar = (texto) => {
    const soloDigitos = String(texto).replace(/\D+/g, "");
    return maxLength ? soloDigitos.slice(0, maxLength) : soloDigitos;
  };

  return (
    <input
      {...resto}
      type="text"
      inputMode="numeric"
      value={value ?? ""}
      onChange={(e) => onChange(limpiar(e.target.value))}
      onPaste={(e) => {
        e.preventDefault();
        onChange(limpiar(`${value ?? ""}${e.clipboardData.getData("text")}`));
      }}
    />
  );
}

/**
 * Documento de identidad venezolano: la nacionalidad se elige y el número se
 * teclea, de modo que en la parte numérica no cabe una letra. Hacia fuera
 * sigue siendo una sola cadena "V-12345678", que es como lo guarda la API.
 */
export function EntradaDocumento({ value = "", onChange, id, className, ...resto }) {
  const texto = String(value ?? "");
  const numero = texto.replace(/^[EV]-?/i, "").replace(/\D+/g, "");

  /*
   * Un documento sin número es cadena vacía, no "E-", porque el campo puede
   * quedar en blanco. Pero entonces la nacionalidad no cabe en el valor, y
   * elegir "E" antes de teclear la cédula se perdía en el acto. Se recuerda
   * aparte y el valor manda en cuanto lo trae.
   */
  const nacEnValor = /^[EV]/i.test(texto) ? texto[0].toUpperCase() : null;
  const [nacElegida, setNacElegida] = useState(() => nacEnValor ?? "V");
  const nacionalidad = nacEnValor ?? nacElegida;

  const componer = (nac, num) => (num ? `${nac}-${num}` : "");

  return (
    <div className="entrada-compuesta">
      <select
        aria-label="Nacionalidad"
        value={nacionalidad}
        onChange={(e) => {
          setNacElegida(e.target.value);
          onChange(componer(e.target.value, numero));
        }}
      >
        <option value="V">V</option>
        <option value="E">E</option>
      </select>

      <EntradaDigitos
        {...resto}
        id={id}
        className={className}
        value={numero}
        maxLength={LIMITES.documento}
        onChange={(num) => onChange(componer(nacionalidad, num))}
      />
    </div>
  );
}

/**
 * Teléfono: dígitos y nada más. Se muestra agrupado 0414-1234567 para leerlo,
 * pero hacia fuera viaja como lo escribió el usuario, sin separadores.
 */
export function EntradaTelefono({ value = "", onChange, ...resto }) {
  const digitos = String(value ?? "").replace(/\D+/g, "");
  const bonito = digitos.length > 4 ? `${digitos.slice(0, 4)}-${digitos.slice(4, 11)}` : digitos;

  return (
    <EntradaDigitos
      {...resto}
      value={bonito}
      maxLength={LIMITES.telefono}
      onChange={(num) => onChange(num)}
    />
  );
}

/**
 * Fecha. Por defecto no admite futuro, que es lo correcto para todo lo que ya
 * ocurrió: nacimiento, entrada del expediente, actuación de la bitácora. Los
 * casos que sí miran adelante (una citación, una devolución prevista) han de
 * pedirlo explícitamente con permitirFuturo.
 */
export function EntradaFecha({ value = "", onChange, permitirFuturo = false, max, min, ...resto }) {
  return (
    <input
      {...resto}
      type="date"
      value={value ?? ""}
      max={max ?? (permitirFuturo ? undefined : hoyISO())}
      min={min}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
