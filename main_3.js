// Configuración
const URL =
  "https://api.allorigins.win/get?url=https://api.preciodelaluz.org/v1/prices/all?zone=PCB";
const LOCAL_STORAGE_KEY = "precios-luz";

const consumoOrdenador = 0.25; // en Kw/h
const consumoNevera = 0.9;
const consumoCalefactor = 2.0;

// MAIN
async function main() {
  let precios = null;

  // 1- comprobar si ya tenemos LOS precios guardados y si no cargar del server y guardar
  let preciosString = localStorage.getItem(LOCAL_STORAGE_KEY);

  if (preciosString === null) {
    // si es null, no lo tenemos en el localStorage
    console.log("Cargando precios del servidor por primera vez");
    precios = await getPreciosLuzHoy(); // cargar del server
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(precios)); // guardar como string
  } else {
    precios = JSON.parse(preciosString); // parsear del string guardado en anteriores sesiones
  }

  // 3- los precios cargados son de hoy? si no, cargar del server
  if (precios["00-01"].date != fechaDDMMYYY()) {
    console.log("Actualizando precios a fecha de hoy");
    precios = await getPreciosLuzHoy(); // cargar del server
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(precios)); // guardar como string
  }

  // 4- pillar el precio en la hora actual
  const precioAhoraObj = precios[getRangoHorario()];
  const precioActualHora = {
    hora: getRangoHorario(),
    precio: precioAhoraObj.price,
  };
  const units = precioAhoraObj.units;
  console.log(
    `El precio actual de la luz es ${precioActualHora.precio}${units}`
  );

  // 5- Calcular el rango horario del precio más barato
  const precioMasBarato = CalcularHoraMasBarata(precios);
  console.log(precioMasBarato);

  // 6- Calcular el rango horario del precio más caro
  const precioMasCaro = CalcularHoraMasCaro(precios);
  console.log(precioMasCaro);

  // 8- Función para actualizar el precio de los dispositivos en la pantalla

  actualizaPreciosAparato(
    "ordenador",
    consumoOrdenador,
    precioActualHora,
    precioMasCaro,
    precioMasBarato
  );
  actualizaPreciosAparato(
    "nevera",
    consumoNevera,
    precioActualHora,
    precioMasCaro,
    precioMasBarato
  );
  actualizaPreciosAparato(
    "calefactor",
    consumoCalefactor,
    precioActualHora,
    precioMasCaro,
    precioMasBarato
  );
}

// Devuelve la fecha actual en formato DD-MM-AAAA
function fechaDDMMYYY() {
  const hoy = new Date();

  let dia = hoy.getDate();
  let mes = hoy.getMonth() + 1; // Enero = 0

  if (dia < 10) {
    dia = "0" + dia;
  }

  if (mes < 10) {
    mes = "0" + mes;
  }

  return dia + "-" + mes + "-" + hoy.getFullYear();
}

// Devuelve el rango horario actual en formato "00-01"
function getRangoHorario() {
  const date = new Date();
  let hora = date.getHours();
  let horaSiguiente = hora + 1;

  if (hora < 10) {
    hora = "0" + hora;
  }

  if (horaSiguiente < 10) {
    horaSiguiente = "0" + horaSiguiente;
  }

  return hora + "-" + horaSiguiente;
}

// Carga de la API todos los precios del dia de hoy
async function getPreciosLuzHoy() {
  let response = await fetch(URL);
  let data = await response.json();
  return JSON.parse(data.contents);
}

// Calcular hora más barata
function CalcularHoraMasBarata(precios) {
  let preciosPorHora = [];

  for (const key in precios) {
    precioPorhora = precios[key].price;
    preciosPorHora.push({ hora: key, precio: precioPorhora });
  }

  return preciosPorHora.reduce((previous, current, i) => {
    if (i === 0) {
      return current;
    }
    if (previous.precio < current.precio) {
      return previous;
    }
    return current;
  });
}

// Calcular hora más cara
function CalcularHoraMasCaro(precios) {
  let preciosPorHora = [];

  for (const key in precios) {
    precioPorhora = precios[key].price;
    preciosPorHora.push({ hora: key, precio: precioPorhora });
  }

  return preciosPorHora.reduce((previous, current, i) => {
    if (i === 0) {
      return current;
    }
    if (previous.precio > current.precio) {
      return previous;
    }
    return current;
  });
}

// Función para calcular el precio de un dispositivo
function calculaPrecioAparato(consumoKwh, precioActual) {
  const precioKwh = precioActual / 1000; //precioActual llega en Mw/h
  return (consumoKwh * precioKwh).toFixed(2);
}

// Actualizar Precios Aparato y mostrar en browser
function actualizaPreciosAparato(
  nombreAparato,
  consumo,
  precioActual,
  precioMax,
  precioMin
) {
  const precioAparatoActual = calculaPrecioAparato(
    consumo,
    precioActual.precio
  );
  const precioAparatoMax = calculaPrecioAparato(consumo, precioMax.precio);
  const precioAparatoMin = calculaPrecioAparato(consumo, precioMin.precio);

  document.querySelector(
    `#precio-${nombreAparato}`
  ).textContent = `${precioAparatoActual}`;

  document.querySelector(
    `#precio-${nombreAparato}-hora`
  ).textContent = `${precioActual.hora}`;

  document.querySelector(
    `#precio-${nombreAparato}-max`
  ).textContent = `${precioAparatoMax}`;

  document.querySelector(
    `#precio-${nombreAparato}-max-hora`
  ).textContent = `${precioMax.hora}`;

  document.querySelector(
    `#precio-${nombreAparato}-min`
  ).textContent = `${precioAparatoMin}`;

  document.querySelector(
    `#precio-${nombreAparato}-min-hora`
  ).textContent = `${precioMin.hora}`;
}

main();
// control de la pantalla de inicio
const startElement = document.querySelector("#start");
const primerP = document.querySelector("#textPrice1");
const segundoP = document.querySelector("#textPrice2");
const tercerP = document.querySelector("#textPrice3");
const mainElement = document.querySelector("main");
const headerElement = document.querySelector("header");

startElement.addEventListener("click", (e) => {
  //   startElement.removeAttribute("id", "start");
  startElement.setAttribute("id", "startClicked");
  mainElement.removeAttribute("id", "hidden1");
  headerElement.removeAttribute("id", "hidden2");
});

// control de la pantalla central
const ordenadorCard = document.querySelector("#ordenador");
const neveraCard = document.querySelector("#nevera");
const calefactorCard = document.querySelector("#calefactor");

ordenadorCard.addEventListener("click", (e) => {
  primerP.classList.toggle("blocked");
  ordenadorCard.classList.toggle("card1");
});
neveraCard.addEventListener("click", (e) => {
  segundoP.classList.toggle("blocked");
  neveraCard.classList.toggle("card2");
});
calefactorCard.addEventListener("click", (e) => {
  tercerP.classList.toggle("blocked");
  calefactorCard.classList.toggle("card3");
});

// modo noche/dia

const nocheBttn = document.querySelector("#solLuna");
const bodyElement = document.querySelector("body");

nocheBttn.addEventListener("click", (e) => {
  bodyElement.toggleAttribute("nightA");
  ordenadorCard.toggleAttribute("nightB");
  neveraCard.toggleAttribute("nightB");
  calefactorCard.toggleAttribute("nightB");
  primerP.toggleAttribute("nightC");
  segundoP.toggleAttribute("nightC");
  tercerP.toggleAttribute("nightC");
});
