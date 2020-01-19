//  -----------------------FORMS-----------------------
function validateInputs() {
	const form = document.getElementById("form");
	if (!form.checkValidity()) {
		form.reportValidity();
	}
	return form.checkValidity();
}

function validateArrayInputs() {
	const form = document.getElementById("array-form");
	const errorMsg = "Debe contener enteros separados por coma";
	const tempsValidate = form.elements.temps.value
		.trim()
		.split(",")
		.reduce((acum, v) => acum && !isNaN(v), true)
		? ""
		: errorMsg;
	const coolingsValidate = form.elements.coolings.value
		.trim()
		.split(",")
		.reduce((acum, v) => acum && !isNaN(v), true)
		? ""
		: errorMsg;

	form.elements.temps.setCustomValidity(tempsValidate);
	form.elements.coolings.setCustomValidity(coolingsValidate);

	if (!form.checkValidity()) {
		form.reportValidity();
	}
	return validateInputs() && form.checkValidity();
}

function getFormValues() {
	const form = document.getElementById("form");
	const nc = parseFloat(form.elements.nc.value);
	const tem = parseFloat(form.elements.tem.value);
	const cooling = parseFloat(form.elements.cooling.value);
	const length = parseFloat(form.elements.niter.value);
	const tmax = parseFloat(form.elements.tMax.value) * 1000;

	return { nc, tem, cooling, length, tmax };
}

function getFormArrayValues() {
	const form = document.getElementById("array-form");
	const coolings = form.elements.coolings.value
		.trim()
		.split(",")
		.map(v => parseFloat(v));
	const temps = form.elements.temps.value
		.trim()
		.split(",")
		.map(v => parseFloat(v));

	return { coolings, temps };
}

//  -----------------------ClickEvents-----------------------
function simpleSearch() {
	changeButtonsState(true);
	const { length, ...formValues } = getFormValues();
	const worker = new Worker("iteration_worker.js");
	worker.postMessage({ formValues, length });
	worker.onmessage = ({ data: { finish, result } }) => {
		if (!finish) {
			printResults(result);
		} else {
			changeButtonsState(false);
		}
	};
}
function searchForLocalMinimum() {
	cleanTable();
	changeButtonsState(true);
	const { length, ...formValues } = getFormValues();
	const iterationValues = getFormArrayValues();
	const worker = new Worker("iteration_worker.js");
	worker.postMessage({ formValues, length, iterationValues });
	worker.onmessage = ({ data: { finish, result } }) => {
		if (!finish) {
			printResults(result);
		} else {
			changeButtonsState(false);
		}
	};
}

function changeButtonsState(state) {
	Array.from(document.querySelectorAll("button")).map(
		b => (b.disabled = state)
	);
}

//  -----------------------Table Management-----------------------
function printResults(result) {
	const values = [];
	let color;
	if (result.C != undefined && result.partialResult) {
		color = "orange";
	} else {
		color = result.N.length ? "red" : "green";
	}
	values.push({
		text: result.N.length,
		style: `background-coloR: ${color}`
	});
	values.push({
		text: result.nc
	});
	values.push({
		text: result.tem.toLocaleString()
	});
	values.push({
		text: result.cooling.toLocaleString()
	});
	values.push({
		text: `${result.time.toLocaleString()} ms`
	});
	values.push({
		text: `${
			result.averageTime ? result.averageTime.toLocaleString() : "--"
		} ms`
	});

	const body = document.getElementById("results").querySelector("tbody");
	const tr = document.createElement("tr");
	values.forEach(v => {
		const td = document.createElement("td");
		td.textContent = v.text;
		td.style = v.style;
		tr.appendChild(td);
	});
	const td = document.createElement("td");
	td.className = "td-result";
	const icon = document.createElement("i");
	icon.className = "material-icons i-result";
	if (result.C) {
		icon.innerText = "get_app";
		icon.onclick = downloadResultF({
			S: result.S,
			C: result.C,
			title: `N-${result.nc}`
		});
	} else {
		icon.classList.add("err");
		icon.innerText = "error";
	}
	td.appendChild(icon);
	tr.appendChild(td);
	body.appendChild(tr);
}

function downloadResultF({ S, C, title }) {
	const c_result = C.map(v => {
		return S[v].map(v => {
			let result = v;
			if (v == 1) result = "X";
			if (v == 0) result = 1;
			return result;
		});
	});
	return _ => {
		const csvContent =
			"data:text/csv;charset=utf-8," +
			c_result.map(v => v.join(",")).join("\n");
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement("a");
		link.setAttribute("href", encodedUri);
		link.setAttribute("download", `${title}.csv`);
		document.body.appendChild(link);

		link.click();
		link.remove();
	};
}
function cleanTable() {
	const body = document.getElementById("results").querySelector("tbody");
	while (body.firstChild) {
		body.removeChild(body.firstChild);
	}
}
