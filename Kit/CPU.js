var ram = [];//2^64 locations
var hj =0;//has jumped flag //only psecifc to the emulator
var flag_r = 0;//flags disconnected from regular registers for reasons...

/*
    BIT[0] = NMI
    BIT[1] = IRQ
    BIT[2] = GT
    BIT[3] = LT
    BIT[4] = EQ
    BIT[5] = NE
    BIT[6] = HLT
*/
var reg_file = []; //A,B,C,D,PXD1,PXD2,PXD3,PC,SP,BP,VTP,ISPC <-order
//AN INS REG WILL NEED TO BE ADDED FOR HARDWARE


//An insruction will be 64 bits long
//First 8 bits will be the OP Code
//Next 28 bits will be the Param
//Next 28 bits will be the param


//big endian

//all accumulator type registers are 32 bits in length
//pc will be treated as a 28 bit register <- Addressing does not determine the bitage
//byte 8 bits
//double byte 16 bits
// word 32 bits

reg_file[7]=0;//pc
function cp(offset){//current position
    return ram[reg_file[7]+offset];
}

function extract_28_bits(h,m1,m2,l){
    return (0x0000000 | ((h&(0xf)) <<24) | (m1<<16) | (m2<<8) | (l));
}


function makeopcode(op,p1,p2,mod){
    return [
        op,
        mod,
		(p1&0xf000000)>>24,
        (p1&0x0ff0000)>>16,
        (p1&0x000ff00) >> 8,
        (p1&0x00000ff),
       
		(p2&0xf000000)>>24,
        (p2&0x0ff0000)>>16,
        (p2&0x000ff00) >> 8,
        (p2&0x00000ff)]
}

var ipc = 0;
function appins(ins){
    for(i =0; i< 10;i++){
        ram[i+ipc] =  ins[i];
    }
    ipc += 10;
}


function inc(offset){
    reg_file[7]+=offset;
}
// 0F FF FF FF <- 28 bits
// 0x FF FF FF FF FF FF FF FF <- 72 bits

function err(s){
    console.log("Error: " + s);
}

function execute(){
		let op = cp(0);
		let p1 = extract_28_bits(cp(2),cp(3),cp(4),cp(5));
		let p2 = extract_28_bits(cp(6),cp(7),cp(8),cp(9));
		let mod = cp(1);
		switch(op){
			case 0x29: //LV Reg,Direct
				reg_file[p1] = p2;
			break;
			
			case 0x01: //LV reg,[Mem]
				if(mod == 0x00){ // byte operation
					reg_file[p1] = (ram[p2] &0xff);
				}else if(mod == 0x01){//double byte operation
					reg_file[p1] = extract_28_bits(0,0,ram[p2] ,ram[p2+1]);
				}else if(mod == 0x02){// word operation
					reg_file[p1] = extract_28_bits(ram[p2] ,ram[p2+1],ram[p2+2],ram[p2+3]);
				}else{
					err("LV err");
				}
			break;
		   
			case 0x02: //LV Reg,Reg
				reg_file[p1] = reg_file[p2];
			break;
		   
			case 0x03: //LV [Mem],Reg
				

				if(mod == 0x00){ // byte operation
					ram[p1] = reg_file[p2]&0xff;
				}else if(mod == 0x01){//double byte operation
					ram[p1] = ((reg_file[p2]&0xffff)&0xff00)>>8;
					ram[p1+1] = (reg_file[p2]&0xffff)&0xff;
				}else if(mod == 0x02){// word operation
					ram[p1] = (reg_file[p2]&0xf000000)>>24;
					ram[p1+1] = (reg_file[p2]&0x0ff0000)>>16;
					ram[p1+2] = (reg_file[p2]&0x000ff00)>>8;
					ram[p1+3] = reg_file[p2]&0x00000ff;
				}else{
					err("LV err");
				}
			break;
		   
			case 0x04://LV reg,[reg]
				if(mod == 0x00){ // byte operation
					reg_file[p1] = ram[reg_file[p2]] & 0xff;
				}else if(mod == 0x01){//double byte operation
					reg_file[p1] = extract_28_bits(
						0,
						0,
						ram[reg_file[p2]],
						ram[reg_file[p2]+1]);
					   
				}else if(mod == 0x02){// word operation
					reg_file[p1] = extract_28_bits(
						ram[reg_file[p2]],
						ram[reg_file[p2]+1],
						ram[reg_file[p2]+2],
						ram[reg_file[p2]+3]);
					   
				}else{
					err("LV err");
				}
			break;
		case 0x05://LV [reg],reg
				if(mod == 0x00){ // byte operation
				ram[reg_file[p1]] = reg_file[p2] & 0xff;
				}else if(mod == 0x01){//double byte operation
					ram[reg_file[p1]] = (reg_file[p2]&0x000ff00)>>8;
					ram[reg_file[p1]+1] = reg_file[p2]&0x00000ff;

				}else if(mod == 0x02){// word operation

					ram[reg_file[p1]] = (reg_file[p2]&0xf000000)>>24;
					ram[reg_file[p1]+1] = (reg_file[p2]&0x0ff0000)>>16;
					ram[reg_file[p1]+2] = (reg_file[p2]&0x000ff00)>>8;
					ram[reg_file[p1]+3] = reg_file[p2]&0x00000ff;
				}else{
					err("LV err");
				}
			break;
			case 0x6: // ADD reg,direct
		reg_file[p1] += p2;
	   break;
		case 0x7: // ADD reg,reg
		  reg_file[p1] += reg_file[p2];
		break;
		case 0x8: // SUB reg,direct
			reg_file[p1] -= p2;
		   break;
		case 0x9: // SUB reg,reg
		  reg_file[p1] -= reg_file[p2];
		break;
		case 0xa: // MUL reg,direct
			reg_file[p1] *= p2;
		   break;
		case 0xb: // MUL reg,reg
		  reg_file[p1] *= reg_file[p2];
		break;
		case 0xc: // DIV reg,direct
			reg_file[p1] /= p2;
		   break;
		case 0xd: // DIV reg,reg
		  reg_file[p1] /= reg_file[p2];
		break;
		case 0xe: // MOD reg,direct
			reg_file[p1] %= p2;
		   break;
		case 0xf: // MOD reg,reg
		  reg_file[p1] %= reg_file[p2];
		break;
		case 0x10: // AND reg,direct
			reg_file[p1] &= p2;
		   break;
		case 0x11: // AND reg,reg
		  reg_file[p1] &= reg_file[p2];
		break;
		case 0x12: // XOR reg,direct
			reg_file[p1] ^= p2;
		   break;
		case 0x13: // XOR reg,reg
		  reg_file[p1] ^= reg_file[p2];
		break;
		case 0x14: // OR reg,direct
			reg_file[p1] |= p2;
		   break;
		case 0x15: // OR reg,reg
		  reg_file[p1] |= reg_file[p2];
		break;
		case 0x16: // LS reg,direct
			reg_file[p1] <<= p2;
		   break;
		case 0x17: // LS reg,reg
		  reg_file[p1] <<= reg_file[p2];
		break;
		case 0x18: // RS reg,direct
			reg_file[p1] >>= p2;
		   break;
		case 0x19: // RS reg,reg
		  reg_file[p1] >>= reg_file[p2];
		break;
		case 0x1a: // PSH direct
			ram[reg_file[8]] = (p1&0xf000000)>>24;
			ram[reg_file[8]+1] =(p1&0x0ff0000)>>16,
			ram[reg_file[8]+2] =(p1&0x000ff00) >> 8,
			ram[reg_file[8]+3] =(p1&0x00000ff);
			reg_file[8]-=4;
		break;
		case 0x1b: //PSH reg
			ram[reg_file[8]] = (reg_file[p1]&0xf000000)>>24;
			ram[reg_file[8]+1] =(reg_file[p1]&0x0ff0000)>>16,
			ram[reg_file[8]+2] =(reg_file[p1]&0x000ff00) >> 8,
			ram[reg_file[8]+3] =(reg_file[p1]&0x00000ff);
			reg_file[8]-=4;
		break;
		case 0x1c: //pop reg
			reg_file[8]+=4;
			reg_file[p1]= extract_28_bits(
						ram[reg_file[8]],
						ram[reg_file[8]+1],
						ram[reg_file[8]+2],
						ram[reg_file[8]+3]);
		break;
		/*
			BIT[0] = NMI
			BIT[1] = IRQ
			BIT[2] = GT
			BIT[3] = LT
			BIT[4] = EQ
			BIT[5] = NE
		*/
		case 0x1d: // CMP reg,direct
			flag_r |= (reg_file[p1] > p2)<<2;
			flag_r |= (reg_file[p1] < p2)<<3;
			flag_r |= (reg_file[p1] == p2)<<4;
			flag_r |= (reg_file[p1] != p2)<<5;
		   break;
		case 0x1e: // CMP reg,reg
			flag_r |= (reg_file[p1] < reg_file[p2])<<2;
			flag_r |= (reg_file[p1] > reg_file[p2])<<3;
			flag_r |= (reg_file[p1] == reg_file[p2])<<4;
			flag_r |= (reg_file[p1] != reg_file[p2])<<5;
		break;
	   
		case 0x1f: // JMP direct
			reg_file[7] = p1;
			hj=1;
		break;
		case 0x20: // JG direct
			if((flag_r&0b000100) != 0){
				reg_file[7] = p1;
				flag_r ^= 0b000100;
				hj=1;
				
			}
			cf(); // clear flags
		break;
		case 0x21: // JL direct
			if((flag_r&0b001000) != 0){
				reg_file[7] = p1;
				flag_r ^= 0b001000;
				hj=1;
				
			}
			cf(); // clear flags
		break;
		case 0x22: // JEQ direct
			if((flag_r&0b010000) != 0){
				reg_file[7] = p1;
				flag_r ^= 0b010000;
				hj=1;
				
			}
			cf(); // clear flags
		break;
		case 0x23: // JNE direct
			if((flag_r&0b100000) != 0){
				reg_file[7] = p1;
				flag_r ^= 0b100000;
				hj=1;
				
			}
			cf(); // clear flags
		break;
		case 0x24: // CALL direct
			inc(10);
			ram[reg_file[8]] = (reg_file[8]&0xf000000)>>24;
			ram[reg_file[8]+1] =(reg_file[8]&0x0ff0000)>>16,
			ram[reg_file[8]+2] =(reg_file[8]&0x000ff00) >> 8,
			ram[reg_file[8]+3] =(reg_file[8]&0x00000ff);
			reg_file[8]-=4;
			
			ram[reg_file[8]] = (reg_file[9]&0xf000000)>>24;
			ram[reg_file[8]+1] =(reg_file[9]&0x0ff0000)>>16,
			ram[reg_file[8]+2] =(reg_file[9]&0x000ff00) >> 8,
			ram[reg_file[8]+3] =(reg_file[9]&0x00000ff);
			
			reg_file[8]-=4;
			
			ram[reg_file[8]] = (reg_file[7]&0xf000000)>>24;
			ram[reg_file[8]+1] =(reg_file[7]&0x0ff0000)>>16,
			ram[reg_file[8]+2] =(reg_file[7]&0x000ff00) >> 8,
			ram[reg_file[8]+3] =(reg_file[7]&0x00000ff);
			
			reg_file[8]-=4;
			


			
			reg_file[7] = p1;
			hj=1;
		break;
	   
		case 0x25: // CALL reg - calls a location by reg
			inc(10);
			ram[reg_file[8]] = (reg_file[8]&0xf000000)>>24;
			ram[reg_file[8]+1] =(reg_file[8]&0x0ff0000)>>16,
			ram[reg_file[8]+2] =(reg_file[8]&0x000ff00) >> 8,
			ram[reg_file[8]+3] =(reg_file[8]&0x00000ff);
			reg_file[8]-=4;
			
			ram[reg_file[8]] = (reg_file[9]&0xf000000)>>24;
			ram[reg_file[8]+1] =(reg_file[9]&0x0ff0000)>>16,
			ram[reg_file[8]+2] =(reg_file[9]&0x000ff00) >> 8,
			ram[reg_file[8]+3] =(reg_file[9]&0x00000ff);
			
			reg_file[8]-=4;
			
			ram[reg_file[8]] = (reg_file[7]&0xf000000)>>24;
			ram[reg_file[8]+1] =(reg_file[7]&0x0ff0000)>>16,
			ram[reg_file[8]+2] =(reg_file[7]&0x000ff00) >> 8,
			ram[reg_file[8]+3] =(reg_file[7]&0x00000ff);
			
			reg_file[8]-=4;
			
			
			reg_file[7] = reg_file[p1];
			hj = 1;
		break;
		case 0x26: //COW
			reg_file[11] = reg_file[7];
			reg_file[7] = extract_28_bits(
				ram[reg_file[10] + (p1*4)],
				ram[reg_file[10]+1+ (p1*4)],
				ram[reg_file[10]+2+ (p1*4)],
				ram[reg_file[10]+3+ (p1*4)]);
				flag_r ^= 0b0000010;
				hj=1;
		break;
		case 0x27: //RTI
			reg_file[7] = reg_file[11];
			flag_r ^= 0b0000010;
			hj=1;
		break;
		case 0x28: //RET

			reg_file[8]+=4;
			reg_file[7] = extract_28_bits(
						ram[reg_file[8]],
						ram[reg_file[8]+1],
						ram[reg_file[8]+2],
						ram[reg_file[8]+3]);
			reg_file[8]+=4;
			reg_file[9] = extract_28_bits(
						ram[reg_file[8]],
						ram[reg_file[8]+1],
						ram[reg_file[8]+2],
						ram[reg_file[8]+3]);
			reg_file[8]+=4;
			reg_file[8] = extract_28_bits(
						ram[reg_file[8]],
						ram[reg_file[8]+1],
						ram[reg_file[8]+2],
						ram[reg_file[8]+3]);

			hj=1;
		break;
		case 0x00: //HLT
			flag_r ^= 0b1000000;
			inc(-10);
		break;
		case 0x41: //HLT
			flag_r ^= 0b1000000;
			inc(-10);
		break;
		case undefined: //HLT
			flag_r ^= 0b1000000;
			inc(-10);
		break;
	}

		if(hj ==0){
			inc(10);
			
		}else{
			hj = 0;
		}
}

function cf(){
	flag_r &= 0b0000000;
	
	
} // clear flags


function hexdmp(s,e){
		document.getElementById("reg_disp").textContent ="";
	document.getElementById("hexdmp").textContent ="";

	var str = "";
	var start_location = s;
	var end_location =e;
	
	for(let i = start_location; i<e;i++){
		if(i%16 == 0 && i!=start_location){
			document.getElementById("hexdmp").textContent +=i.toString(16).padStart(7, '0')+": "+str +"\n";
			str = "";
		}
		if(ram[i] != undefined){
			str += " " + ram[i].toString(16).padStart(2, '0');
		}else{
			str += " 00";
		}
	}
	document.getElementById("hexdmp").textContent +=i.toString(16).padStart(7, '0')+": "+str+"\n";

	var reg_decode2 = ["A",
	"B",
	"C",
	"D",
	"PXD1",
	"PXD2",
	"PXD3",
	"PC",
	"SP",
	"BP",
	"VTP",
	"ISPC"];
	
   document.getElementById("reg_disp").textContent = "";
	for(let i = 0; i<reg_decode2.length;i++){
		document.getElementById("reg_disp").textContent += reg_decode2[i] + ": " + reg_file[i] + "\n";
	}
	document.getElementById("reg_disp").textContent += "Flags: " + flag_r.toString(2)+"\n";

}

function display_mmio_scr(){
	
		document.getElementById("display area").textContent = "";
	for(let i=0; i< 1024; i++){
			if((i%64) == 0 && i !=0){
				document.getElementById("display area").textContent += '\n';
			}
			document.getElementById("display area").textContent += String.fromCharCode (ram[i]);
	}
}

function run(){
	
	while((flag_r & 0b1000000) == 0){
		execute();
		/*
        console.log(reg_file[0],reg_file[1],reg_file[7] , disassembler_ins[ram[reg_file[7]]],
                   
                   extract_28_bits(ram[reg_file[7]+1],ram[reg_file[7]+2],ram[reg_file[7]+3],ram[reg_file[7]+4]),
                    extract_28_bits(ram[reg_file[7]+5],ram[reg_file[7]+6],ram[reg_file[7]+7],ram[reg_file[7]+8]),memory_to_asm_ins[reg_file[7]]

);
*/
	}

	/*
	//will reactivate a mmio_graph later 
		let c = document.getElementById("mmio_graph");
		let ctx = c.getContext("2d");
		let col_pick = ['#000000', '#005500', '#00aa00', '#00ff00', '#0000ff', '#0055ff', '#00aaff', '#00ffff', '#ff0000', '#ff5500', '#ffaa00', '#ffff00', '#ff00ff', '#ff55ff', '#ffaaff', '#ffffff'];		
		
		for(let i=0; i< 32; i++){
			for(let k=0; k< 32; k++){
				ctx.fillStyle = col_pick[ram[i*k]];
				ctx.fillRect(k*4,i*4,4,4);
			}
		}		
*/
	
	display_mmio_scr();

}


function step(){
	
	if((flag_r & 0b1000000) == 0&& reg_file[7]){
		execute();
		display_mmio_scr();

		console.log(reg_file[0],reg_file[1],reg_file[7] , disassembler_ins[ram[reg_file[7]]]);

	}
	
}


function run_set_int(){
	
	setInterval(function(){
if((flag_r & 0b1000000) == 0&& reg_file[7]){
		execute();
		display_mmio_scr();

		console.log(reg_file[0],reg_file[1],reg_file[7] , disassembler_ins[ram[reg_file[7]]]);

	}
	

	},1);

	/*
	//will reactivate a mmio_graph later 
		let c = document.getElementById("mmio_graph");
		let ctx = c.getContext("2d");
		let col_pick = ['#000000', '#005500', '#00aa00', '#00ff00', '#0000ff', '#0055ff', '#00aaff', '#00ffff', '#ff0000', '#ff5500', '#ffaa00', '#ffff00', '#ff00ff', '#ff55ff', '#ffaaff', '#ffffff'];		
		
		for(let i=0; i< 32; i++){
			for(let k=0; k< 32; k++){
				ctx.fillStyle = col_pick[ram[i*k]];
				ctx.fillRect(k*4,i*4,4,4);
			}
		}		
*/
	

}
