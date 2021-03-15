import React from "react";
import {
  HardshipDeclarationCheckbox,
  HardshipDeclarationFC,
  HardshipDeclarationFilledField as FilledField,
} from ".";

const HardshipDeclarationEnglish: HardshipDeclarationFC = (props) => (
  <>
    <p>
      Número de índice (si se conoce/si es aplicable):{" "}
      <FilledField>{props.indexNumber || ""}</FilledField>
    </p>
    <p>
      Condado y Tribunal (si se conoce/si es aplicable):{" "}
      <FilledField>{props.countyAndCourt || ""}</FilledField>
    </p>
    <h2>
      Declaración De Penuria Del Inquilino Durante La Panedmia Del Covid-19
    </h2>
    <p>
      Soy el inquilino(a), ocupante legal, u otra persona responsable por los
      pagos de alquiler, el uso y la ocupación u otra obligación financiera bajo
      el contrato de arrendamiento o tenencia en (dirección de la unidad de
      vivienda):
    </p>
    <p>
      <FilledField>{props.address}</FilledField>
    </p>
    <p>
      <strong>
        Indique a continuación su calificación para la protección contra el
        desalojo al seleccionar la opción “A”, “B” o ambas.
      </strong>
    </p>

    <p>
      <HardshipDeclarationCheckbox checked={props.hasFinancialHardship} />
      A. Tengo dificultades económicas y no puedo pagar en su totalidad mi
      alquiler u otras obligaciones bajo el contrato de alquiler ni puedo
      obtener vivienda permanente, alterna y adecuada debido a una o más de las
      siguientes razones:
    </p>
    <ol>
      <li>
        Perdida significativa de ingresos del hogar durante la pandemia
        COVID-19.
      </li>
      <li>
        Aumento en gastos corrientes necesarios relacionados con la realización
        de trabajo esencial o relacionados con el impacto sobre la salud durante
        la pandemia COVID-19.
      </li>
      <li>
        Las responsabilidades de cuidado diurno para menores o el cuidado de
        familiares ancianos, discapacitados o enfermos durante la pandemia
        COVID-19 han impactado negativamente sobre mi capacidad o la capacidad
        de otros integrantes del hogar de obtener empleo significativo, ganar
        ingresos, o han aumentado los gastos.
      </li>
      <li>
        Es difícil mudarme debido a los gastos de mudanza y la dificultad en
        conseguir una vivienda alterna u otra residencia durante la pandemia
        COVID-19.
      </li>
      <li>
        Otras circunstancias relacionadas con la pandemia COVID-19 han impactado
        negativamente mi capacidad de obtener empleo significativo o ganar
        ingresos o los ingresos del hogar han reducido significativamente o han
        aumentado significativamente mis gastos.
      </li>
    </ol>
    <p>
      En la medida en que he perdido ingresos en el hogar o han aumentado los
      gastos, el ingreso recibido, sea por asistencia pública, incluso el seguro
      de desempleo, asistencia por desempleo por causa de la pandemia, el seguro
      por discapacidad o la licencia familiar pagada, que haya recibido desde el
      comienzo de la pandemia COVID-19 no compensa en su totalidad la pérdida de
      ingresos del hogar o el aumento de los gastos.
    </p>
    <p>
      <HardshipDeclarationCheckbox checked={props.hasHealthRisk} />
      B. Desocupar la instalación y mudarme a una nueva vivienda permanente
      presentaría un grave riesgo a mi salud o a la salud de un integrante del
      hogar a enfermedad grave o muerte por COVID-19 debido a ser mayor de 65
      años, una discapacidad o afecciones subyacentes, que puede incluir, entre
      otros, estar inmunodeprimido.
    </p>
    <p>
      Entiendo que debo cumplir con todos los demás términos legales de mi
      contrato de alquiler y tenencia o contrato semejante. Además, entiendo que
      los honorarios, multas o intereses legales por impago total de alquiler o
      por no haber cumplido con otras obligaciones financieras según requerido
      por mi tenencia, contrato de alquiler o contrato semejante aún podrán
      cobrarse y resultar en un fallo monetario en mi contra. Además, entiendo
      que mi casero puede solicitar el desalojo después del 1 de mayo del 2021 y
      que la ley puede proporcionarle, en ese momento, ciertas protecciones
      independientes disponibles a través de esta declaración.
    </p>
    <p>
      Firmado: <FilledField>{props.name}</FilledField>
    </p>
    <p>
      Nombre impreso: <FilledField>{props.name}</FilledField>
    </p>
    <p>Fecha firmada: {props.date}</p>
    <p>
      AVISO: Está firmando y enviando este formulario bajo pena de ley. Esto
      significa que es ilegal hacer a sabiendas una declaración falsa en este
      formulario.
    </p>
  </>
);

export default HardshipDeclarationEnglish;
