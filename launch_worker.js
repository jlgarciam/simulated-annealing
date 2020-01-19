(function(self) {
	importScripts("/implementation.js");
	self.onmessage = ({ data: { nc, tem, cooling, tmax } }) => {
		const result = simulatedAnnealing(nc, tem, cooling, tmax, 1);
		self.postMessage(result);
		self.close();
	};
})(self);
