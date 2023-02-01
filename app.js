require('dotenv').config();
const axios = require('axios');
const dayjs = require('dayjs');
const open = require('open');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

const getToken = async (dni, password) => {
	loginUrl = 'https://wsportal2023.dim.com.ar/api/v1/auth';
	const data = { nro_documento: dni, password };

	const config = {
		headers: { 'Content-Type': 'application/json' },
	};

	try {
		const res = await axios.post(loginUrl, data);
		return res.data.token;
	} catch (error) {
		console.error('e.message', error.message);
	}
};

const getAppointmentsAvailable = async (
	sinceDate,
	idGrupoMedico,
	idObraSocial,
	token
) => {
	const formattedDate = dayjs(sinceDate).format('YYYY-MM-DD');
	const url = 'https://wsportal2023.dim.com.ar/api/v1/estudios/turnos';
	const data = {
		fechaDesde: formattedDate,
		idGrupoMedico: idGrupoMedico,
		idObraSocial: idObraSocial,
		idPlan: 4219,
	};
	const config = {
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
	};

	try {
		const res = await axios.post(url, data, config);
		return res.data.turnos;
	} catch (error) {
		console.error('e.message', error.message);
	}
};

const getTestiAppointmentsAvailable = async (date, token) => {
	const formattedDate = dayjs(date).format('YYYY-MM-DD');
	const urlTestificacion = `https://wsportal2023.dim.com.ar/api/v1/consulta_medica/turnosDisponibles/ALE/TESTI/${formattedDate}/false/false/`;

	console.log('formattedDate', formattedDate);
	const config = {
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
	};

	try {
		const res = await axios.get(urlTestificacion, config);
		console.log(res.data);
		return res.data.turnos;
	} catch (error) {
		console.error('e.message', error.message);
	}
};

const main = async () => {
	const today = new Date();
	const dni = parseInt(process.env.DNI);
	const password = parseInt(process.env.PASS);
	const idGrupoMedico = 7; //31 alergista 8 dermato 12 endocrinologo 7 clinica
	const token = await getToken(dni, password);
	const searchUpToDays = 60;

	const appointments = await getAppointmentsAvailable(
		today,
		idGrupoMedico,
		'SMG',
		token
	);

	// const appointments = await getTestiAppointmentsAvailable('2023-03-16', token);

	const formattedAppointments = appointments.map((appointment) => {
		return {
			centro: appointment.centro,
			direccion: appointment.ubicacion,
			fecha: dayjs(appointment.fecha).format('DD/MM/YYYY'),
			hora: appointment.hora,
			especialista: appointment.medico,
			especialidad: appointment.especialidad,
		};
	});

	const filteredAppointments = formattedAppointments.filter((appointment) => {
		const date = dayjs(appointment.fecha, 'DD/MM/YYYY');
		const diff = date.diff(dayjs(), 'day');
		return diff <= searchUpToDays;
	});

	return filteredAppointments;
};

const interval = setInterval(async () => {
	const appointments = await main();
	console.info('Buscando turnos...');

	if (appointments.length > 0) {
		console.info('Turnos encontrados');
		open('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
		clearInterval(interval);
	}
}, 5000);

main();
