(function(self) {
	function fetchJSONFile(path) {
		return await new Promise(resolve => {
			let httpRequest = XMLHttpRequest();
			httpRequest.onreadystatechange = function() {
				if (httpRequest.readyState === 4) {
					if (httpRequest.status === 200) {
						launchWorker =
							"data:text/javascript;charset=US-ASCII," +
							httpRequest.responseText;
							resolve(launchWorker); 
					}
				}
			};
			httpRequest.open("GET", path);
			httpRequest.send();
		});
	}

	let launchWorker;

	self.onmessage = async ({
		data: { length, formValues, iterationValues }
	}) => {
		let result;
		fetchJSONFile(
			"https://raw.githubusercontent.com/jlgarciam/simulated-annealing/master/launch_worker.js"
		);
		if (iterationValues) {
			searchLocalMinimum({
				length,
				formValues,
				iterationValues
			});
		} else {
			result = await averageResult({ length, formValues });
			self.postMessage({ result });
			self.postMessage({ finish: true });
			self.close();
		}
	};

	async function searchLocalMinimum({ length, formValues, iterationValues }) {
		let result = {};
		const nc_array = [10, 5, 2, 1];
		let direction = -1;
		let nc_index = 0;
		let nc_loop = formValues.nc + -1 * direction * nc_array[nc_index];

		while (result.partialResult || nc_index != nc_array.length - 1) {
			nc_loop = nc_loop + direction * nc_array[nc_index];
			result = await loopEntry({
				length,
				formValues: { ...formValues, nc: nc_loop },
				...iterationValues
			});
			self.postMessage({ result });
			direction = result.partialResult ? 1 : -1;
			if (result.partialResult && nc_index != nc_array.length - 1) {
				nc_index++;
			}
		}
		self.postMessage({ finish: true });
		self.close();
	}

	async function loopEntry({ formValues, temps, coolings, length }) {
		let bestResult;

		const completeIndex = temps.length * coolings.length;
		for (let index = 0; index < completeIndex; index++) {
			const tem = temps[index % temps.length];
			const cooling = coolings[Math.floor(index / temps.length)];
			let result = await averageResult({
				formValues: { ...formValues, tem, cooling },
				length
			});
			if (
				!bestResult ||
				(bestResult.partialResult && !result.partialResult) ||
				(!result.partialResult && bestResult.averageTime > result.averageTime)
			) {
				bestResult = result;
			}
			console.log(`Completado tem: ${tem} cooling: ${cooling}`);
			console.log(
				`Errores: ${result.partialResult} averageTime: ${result.averageTime} time ${result.time} `
			);
		}
		return bestResult;
	}

	async function averageResult({ length, formValues }) {
		let bestResult = {};
		let partialResult = 0;
		let averageTime = 0;
		(
			await Promise.all(
				Array.from({ length }).map(_ => {
					return new Promise(resolve => {
						const worker = new Worker(launchWorker);
						worker.postMessage(formValues);
						worker.onmessage = ({ data: result }) => {
							resolve(result);
						};
					});
				})
			)
		).forEach(result => {
			partialResult += result.N.length;
			bestResult =
				!bestResult.time || bestResult.time > result.time ? result : bestResult;
			averageTime += result.time;
		});
		averageTime = averageTime / length;
		return { ...bestResult, averageTime, partialResult };
	}
})(self);
