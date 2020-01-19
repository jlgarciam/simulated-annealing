/**
 *  Ejecuta el alogritmo de enfriamiento simulado
 * @param {number} nc Numero de apuestas
 * @param {number} p_tem temperatura inicial
 * @param {number} cooling constante para la actualziacion de temperatura
 * @param {number} R Distancia permitida
 */
function simulatedAnnealing(nc, p_tem, cooling, tmax, R) {
	const t0 = performance.now();
	let tem = p_tem;
	/**
	 * Primero creamos el espacio a recorrer,
	 * luego seleccionamos un subconjunto C aleatorio
	 * y por ultimo calculamos el subespacio (N) no recubierto por C.
	 * ---------
	 * Lo que nos devolvera C son los indices contenidos en S,
	 * por lo que el trabajo sera mas libiano respecto a memoria y a su manejo
	 */
	let S = createSpace(6);
	let C = selectC(S, nc);
	let N = createN(S, C, R);

	/**
	 * El algoritmo segurá iterando hasta encontrar el conjunto C
	 * que recubra todo el espacio S -> N es un subconjunto vacio
	 */
	let whileIndex = 0;
	while (N.length > 0) {
		const current_C = [...C];
		let c_index = whileIndex % C.length;
		replaceOneNotIncluded(S, current_C, c_index);
		const current_N = createN(S, current_C, R);

		/**
		 * Si la longitud de N disminuye
		 *  o si la probabilidad calculada es mayor que una probabilidad aleatoria
		 *  la palabra Ci es sustituida por d, al igual que el subespacio N
		 */
		if (
			N.length > current_N.length ||
			Math.exp(-(current_N.length - N.length) / tem) > Math.random()
		) {
			N = current_N;
			C = current_C;
		}

		if (whileIndex != 0 && whileIndex % C.length == 0) {
			tem = tem * cooling;
		}

		whileIndex++;

		if (tmax && performance.now() - t0 > tmax) {
			C = undefined;
			break;
		}
	}

	const time = performance.now() - t0;
	return { N, nc, tem: p_tem, cooling, time, C, S };
}

/**
 * Devuelve el subconjunto de S no cubierto por el conjunto C dado una distacia R
 * @param {number[]} S Espacio a recubrir
 * @param {number[]} C Conjunto de indices pertenecientes a S
 *                      con el que se pretende cubrir el espacio dado una distancia
 * @param {number} R Distancia permitida
 */
function createN(S, C, R) {
	const N = [];

	for (let sIndex = 0; sIndex < S.length; sIndex++) {
		let coveredCase = true;
		if (!C.includes(sIndex)) {
			coveredCase = C.some(cWordIndex => {
				const distance = S[cWordIndex].reduce(
					(acc, cur, idx) => acc + (cur != S[sIndex][idx])
				);
				return R >= distance;
			});
		}
		if (!coveredCase) N.push(sIndex);
	}
	return N;
}

/**
 * Creacion del espacio con todas las posibilidades
 * dependiendo de las condiciones marcadas por el enunciado
 * @param {number} length : longitud de cada palabra del espacio
 */
function createSpace(length) {
	const total = length * 2;
	const totalSpace = [];
	let currentIndex = 0;
	let currentWord = Array(length).fill(0);
	validateWord(currentWord, totalSpace);
	while (
		total >
		currentWord.reduce(
			(previousValue, currentValue) => previousValue + currentValue
		)
	) {
		currentIndex = nextWord(currentWord, currentIndex);
		validateWord(currentWord, totalSpace);
	}

	return totalSpace;
}

/**
 * Calcula la proxima palabra devolviendo el indice del bit que vamos a modificar en la siguiente
 * iteración
 * @param { number[] } word palabra actual
 * @param { number } currentIndex indice actual
 */
function nextWord(word, currentIndex) {
	if (word.length <= currentIndex) return 0;

	if (word[currentIndex] < 2) {
		word[currentIndex] = word[currentIndex] + 1;
		currentIndex = 0;
	} else {
		word[currentIndex] = 0;
		currentIndex++;
		currentIndex = nextWord(word, currentIndex);
	}
	return currentIndex;
}

/** Valida la palabra actual, debe seguir las siguientes características:
 * X y/o 2 (1-2): 2,3,4
 * X (1): 0,1,2
 * 2 (2): 0,1,2
 * @param {number []} word palabra a validar
 */
function validateWord(word, totalSpace) {
	let counter1 = 0;
	let counter2 = 0;
	for (const bit of word) {
		if (bit === 1) {
			counter1++;
		} else if (bit === 2) {
			counter2++;
		}
	}

	const condition1 = counter1 + counter2 >= 2 && counter1 + counter2 <= 4;
	const condition2 = counter1 <= 2 && counter2 <= 2;

	if (condition1 && condition2) {
		totalSpace.push([...word]);
	}
}

/**
 * Selecciona aleatoriamente una muestra de nC elementos del espacio S
 * devolviendo un array de indices, que seran los incides de las palabras
 * contenidas en S que conformen el conjunto
 * @param { number[] } S Espacio total
 * @param { number } nC  Numero de palabras a seleccionar del espacio
 */
function selectC(S, nC) {
	const index_array = [];
	while (index_array.length < nC) {
		const randomIndex = Math.floor(Math.random() * S.length);
		if (!index_array.includes(randomIndex)) {
			index_array.push(randomIndex);
		}
	}
	return index_array;
}

function replaceOneNotIncluded(S, C, c_index) {
	while (true) {
		const randomIndex = Math.floor(Math.random() * S.length);
		if (!C.includes(randomIndex)) {
			C[c_index] = randomIndex;
			break;
		}
	}
}
