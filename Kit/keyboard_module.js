document.addEventListener('keydown', function(event) {
	ram[0x1000] = String.fromCharCode(event.keyCode).toLowerCase().charCodeAt();
	
			reg_file[11] = reg_file[7];
			reg_file[7] = extract_28_bits(
				ram[reg_file[10]],
				ram[reg_file[10]+1],
				ram[reg_file[10]+2],
				ram[reg_file[10]+3]);
				hj = 1;
			flag_r ^= 0b0000010;
			flag_r ^= 0b1000000;
			console.log(ram[0x1000]);
	run();
});