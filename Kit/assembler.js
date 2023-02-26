var memory_to_asm_ins = {};



var reg_decode = ["A",
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

var ins =["LV",  'ADD',  'SUB',
          'MUL',  'DIV', 'PSH',  'POP',"XOR","OR","AND","MOD","LS","RS",
          'CMP', 'JMP', 'JL',   'JG',
          'JNE',  'JEQ',  'CALL',
          'COW',  'RTI', 'RET','HLT'];

var dotdef = [".ORG",".BYTE",".DBYTE",".WORD"];
var size_mov = ["BYTE","DBYTE","WORD"];
var size_mov_n = [0,1,2];
var digits = "01234456789";
var hex = "xABCDEF";
function lexer(code){
    var intpc= 0;
    var tokens = [];
    var buffer = "";
   
    for(i=0;i<code.length;i++){
		if(code[i] == ";"){
			while(code[i] != "\n"){
				i++;
			}
		}
        if(code[i] == ' ' ||
           code[i] == '\n'||
           code[i] == '\t'||
           code[i] == ','){continue;}
        

		
		
        buffer+=code[i];
        if(ins.includes(buffer)){
            tokens.push({type:"ins",name:buffer,size:10,mod:0,opcode:NaN});
            buffer = "";
        }
       
        if(dotdef.includes(buffer)){
            let size = 0;
            if(buffer == ".BYTE"){
                size = 1;
            }else if(buffer == ".DBYTE"){
                size = 2
            }else if(buffer == ".WORD"){
                size = 4;
            }
            tokens.push({
                type:"dir",
                name: buffer,
                size: size});
            buffer = "";
        }
		
       if(size_mov.includes(buffer)){
            tokens.push({
                    type:"size_spec",
                    name: buffer,
                    value:size_mov.indexOf(buffer),
                    size: 0});
                   
            buffer ="";
       }
       
        if(reg_decode.includes(buffer)){
            if(["A","B","C","D"].includes(buffer) &&
            code[i+1] == ' ' ||
            code[i+1] == ','||
            code[i+1] == '\t'||
            code[i+1] == '\n'||
			code[i+1] == ']'){
                tokens.push({type:"register",reg_name: buffer,size: 0,value: reg_decode.indexOf(buffer)});
               buffer ="";
            }else if(buffer.length >1){
                tokens.push({type:"register",reg_name: buffer,size: 0
                    ,value: reg_decode.indexOf(buffer)
                });
                buffer ="";
            }
             
        }
       
        if(digits.includes(code[i]) && buffer.length ==1){
            while(digits.includes(code[i]) || hex.includes(code[i]) ){
                i++;
                buffer+=code[i];
            }
            tokens.push({type:"int",value:parseInt(buffer),size:0});
            i--;
            buffer="";
        }
       
       
        if(code[i] == '\''){
            buffer = "";
            i++;
            tokens.push({type:"int",value: code[i].charCodeAt(),size:0})
            i++;
        }
       
        if(code[i] == "\""){
            buffer="";
            i++;
            while(code[i] != "\""){
                
				tokens.push({type:"int",value: code[i].charCodeAt(),size:0})
                i++;
            }
            buffer="";
        }
        if(buffer == "LABEL"){
            buffer = "";
            i++;
            while(code[i] != '\n'){
                if(code[i] == '\t' || code[i] == ' '){i++;continue; }
                buffer+=code[i];
                i++;
            }
            tokens.push({type:"label",size:0,name:buffer});
            buffer ="";
        }
        if(buffer == "#"){
            buffer = "";
            i++;
            while(code[i] != '\n' && code[i] != ']'){
                if(code[i] == '\t' || code[i] == ' '){i++;continue; }
                buffer+=code[i];
                i++;
            }
            tokens.push({type:"label_access",size:0,name:buffer});
            buffer ="";
        }
        if(code[i] == '['){
            buffer = "";
        }
       if(code[i] == ']'){
            tokens[tokens.length-1].type+="_point";
            buffer = "";
       }
    }
    return tokens;
}


function secondpass(tokens_ext){
    let tokens = tokens_ext;

    let intpc = 0; //internal program counter
    let label_str = {};
    //first loop gets all the labels
    for(i=0;i<tokens.length;i++){
        let type = tokens[i].type;
        let size = tokens[i].size;
        let name = tokens[i].name;
        if(type == "label"){
            label_str[name] = intpc;
            console.log(intpc,name,label_str);
        }
        if(name == ".ORG"){
            intpc = tokens[i+1].value;
        }
		if(type == "dir" && name != ".ORG"){
			let value = tokens[i+1].value;
			if(tokens[i].size == 1){
				while(tokens[i+1].type == "int"){
					intpc+=1;
					i++;
				}
				intpc-=1;
			}else if(tokens[i].size == 2){
				while(tokens[i+1].type == "int"){
					intpc+=2;
					i++;
				}
				intpc-=2;
			}else if(tokens[i].size == 4){
				while(tokens[i+1].type == "int"){
					intpc+=4;
					i++;
				}
				intpc-=4;
			}
		}
        if(type == "size_spec"){
            if(tokens[i-1].type == "ins"){
                tokens[i-1].mod = size_mov.indexOf(name)
            }else if(tokens[i-2].type == "ins"){
                tokens[i-2].mod = size_mov.indexOf(name)
            }else{
                console.log("Size Error");
            }
            tokens.splice(i,1);
        }
       
        intpc+=size;
    }
    //second loop writes the labels to modified tokens after adding the labels
    for(i=0;i<tokens.length;i++){
            let type = tokens[i].type;
            let size = tokens[i].size;
            let name = tokens[i].name;
        if(type == "label_access"){
                tokens[i].type = "int";
				
                tokens[i].value = label_str[name];
        }if(type == "label_access_point"){
                tokens[i].type = "int_point";
                tokens[i].value = label_str[name];
        }
    }
    
    return tokens;
}

function thirdpass(tokens_ext){
    let tokens = tokens_ext;
    for(i=0;i<tokens.length;i++){
        let type = tokens[i].type;
        let size = tokens[i].size;
        let name = tokens[i].name;
        if(type == "ins"){
            if(tokens[i].name == "LV" && tokens[i + 1].type == "register" && tokens[i + 2].type == "int") {
                tokens[i].opcode = 0x29;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "LV" && tokens[i + 1].type == "register" && tokens[i + 2].type == "int_point") {
                tokens[i].opcode = 0x01;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "LV" && tokens[i + 1].type == "register" && tokens[i + 2].type == "register") {
                tokens[i].opcode = 0x02;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "LV" && tokens[i + 1].type == "int_point" && tokens[i + 2].type == "register") {
                tokens[i].opcode = 0x03;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "LV" && tokens[i + 1].type == "register" && tokens[i + 2].type == "register_point") {
                tokens[i].opcode = 0x04;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "LV" && tokens[i + 1].type == "register_point" && tokens[i + 2].type == "register") {
                tokens[i].opcode = 0x05;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "ADD" && tokens[i + 1].type == "register" && tokens[i + 2].type == "int") {
                tokens[i].opcode = 0x06;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "ADD" && tokens[i + 1].type == "register" && tokens[i + 2].type == "register") {
                tokens[i].opcode = 0x07;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "SUB" && tokens[i + 1].type == "register" && tokens[i + 2].type == "int") {
                tokens[i].opcode = 0x08;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "SUB" && tokens[i + 1].type == "register" && tokens[i + 2].type == "register") {
                tokens[i].opcode = 0x09;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "MUL" && tokens[i + 1].type == "register" && tokens[i + 2].type == "int") {
                tokens[i].opcode = 0x0a;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "MUL" && tokens[i + 1].type == "register" && tokens[i + 2].type == "register") {
                tokens[i].opcode = 0x0b;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "DIV" && tokens[i + 1].type == "register" && tokens[i + 2].type == "int") {
                tokens[i].opcode = 0x0c;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "DIV" && tokens[i + 1].type == "register" && tokens[i + 2].type == "register") {
                tokens[i].opcode = 0x0d;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "MOD" && tokens[i + 1].type == "register" && tokens[i + 2].type == "int") {
                tokens[i].opcode = 0x0e;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "MOD" && tokens[i + 1].type == "register" && tokens[i + 2].type == "register") {
                tokens[i].opcode = 0x0f;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "AND" && tokens[i + 1].type == "register" && tokens[i + 2].type == "int") {
                tokens[i].opcode = 0x10;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "AND" && tokens[i + 1].type == "register" && tokens[i + 2].type == "register") {
                tokens[i].opcode = 0x11;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "XOR" && tokens[i + 1].type == "register" && tokens[i + 2].type == "int") {
                tokens[i].opcode = 0x12;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "XOR" && tokens[i + 1].type == "register" && tokens[i + 2].type == "register") {
                tokens[i].opcode = 0x13;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "OR" && tokens[i + 1].type == "register" && tokens[i + 2].type == "int") {
                tokens[i].opcode = 0x14;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "OR" && tokens[i + 1].type == "register" && tokens[i + 2].type == "register") {
                tokens[i].opcode = 0x15;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "LS" && tokens[i + 1].type == "register" && tokens[i + 2].type == "int") {
                tokens[i].opcode = 0x16;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "LS" && tokens[i + 1].type == "register" && tokens[i + 2].type == "register") {
                tokens[i].opcode = 0x17;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "RS" && tokens[i + 1].type == "register" && tokens[i + 2].type == "int") {
                tokens[i].opcode = 0x18;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "RS" && tokens[i + 1].type == "register" && tokens[i + 2].type == "register") {
                tokens[i].opcode = 0x19;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "PSH" && tokens[i + 1].type == "int") {
                tokens[i].opcode = 0x1a;
                tokens[i].amp = 1;
            }
            if(tokens[i].name == "PSH" && tokens[i + 1].type == "register") {
                tokens[i].opcode = 0x1b;
                tokens[i].amp = 1;
            }
            if(tokens[i].name == "POP" && tokens[i + 1].type == "register") {
                tokens[i].opcode = 0x1C;
                tokens[i].amp = 1;
            }
            if(tokens[i].name == "CMP" && tokens[i + 1].type == "register" && tokens[i + 2].type == "int") {
                tokens[i].opcode = 0x1d;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "CMP" && tokens[i + 1].type == "register" && tokens[i + 2].type == "register") {
                tokens[i].opcode = 0x1e;
                tokens[i].amp = 2;
            }
            if(tokens[i].name == "JMP" && tokens[i + 1].type == "int") {
                tokens[i].opcode = 0x1f;
                tokens[i].amp = 1;
            }
            if(tokens[i].name == "JG" && tokens[i + 1].type == "int") {
                tokens[i].opcode = 0x20;
                tokens[i].amp = 1;
            }
            if(tokens[i].name == "JL" && tokens[i + 1].type == "int") {
                tokens[i].opcode = 0x21;
                tokens[i].amp = 1;
            }
            if(tokens[i].name == "JEQ" && tokens[i + 1].type == "int") {
                tokens[i].opcode = 0x22;
                tokens[i].amp = 1;
            }
            if(tokens[i].name == "JNE" && tokens[i + 1].type == "int") {
                tokens[i].opcode = 0x23;
                tokens[i].amp = 1;
            }
            if(tokens[i].name == "CALL" && tokens[i + 1].type == "int") {
                tokens[i].opcode = 0x24;
                tokens[i].amp = 1;
            }
            if(tokens[i].name == "CALL" && tokens[i + 1].type == "register") {
                tokens[i].opcode = 0x25;
                tokens[i].amp = 1;
            }
            if(tokens[i].name == "COW" && tokens[i + 1].type == "int") {
                tokens[i].opcode = 0x26;
                tokens[i].amp = 1;
            }
            if(tokens[i].name == "RTI") {
                tokens[i].opcode = 0x27;
                tokens[i].amp = 0;
            }
            if(tokens[i].name == "RET") {
                tokens[i].opcode = 0x28;
                tokens[i].amp = 0;
            }
            if(tokens[i].name == "HLT") {
                tokens[i].opcode = 0x00;
                tokens[i].amp = 0;
            }
        }
    }
    //amp is the ammount of parameters
    return tokens;
}




function code_gen(tokens_ext){

    let tokens = tokens_ext;
   
    for(let i =0; i< tokens.length; i++){
        let type = tokens[i].type;
        let name = tokens[i].name;
       
        if(type == "ins"){
            let d = [];
            if(tokens[i].amp == 0)
            {d=makeopcode(tokens[i].opcode,0,0,tokens[i].mod);}
            if(tokens[i].amp ==1)
            {d=makeopcode(tokens[i].opcode,tokens[i+1].value,0,tokens[i].mod);}
            if(tokens[i].amp == 2)
            {d=makeopcode(tokens[i].opcode,tokens[i+1].value,tokens[i+2].value,tokens[i].mod);}
            memory_to_asm_ins[ipc] = [tokens[i],tokens[i+1],tokens[i+2]];
            appins(d);
        }
		
		if(type == "dir" && name != ".ORG"){
			let value = tokens[i+1].value;
			if(tokens[i].size == 1){
				while(tokens[i+1].type == "int"){
					value = tokens[i+1].value;
					ram[ipc] = tokens[i+1].value&0x00000ff;
					ipc+=1;
					i++;
				}
			}else if(tokens[i].size == 2){
				while(tokens[i+1].type == "int"){
					value = tokens[i+1].value;
					ram[ipc] = (value&0x000ff00)>>8;
					ram[ipc+1] = value&0x00000ff;
					ipc+=2;
					i++;
				}
			}else if(tokens[i].size == 4){
				while(tokens[i+1].type == "int"){
					value = tokens[i+1].value;
					ram[ipc] = (value&0xf000000)>>24;
					ram[ipc+1] = (value&0x0ff0000)>>16;
					ram[ipc+2] = (value&0x000ff00)>>8;
					ram[ipc+3] = value&0x00000ff;
					ipc+=4;
					i++;
				}
			}
		}
		if(name == ".ORG"){
			ipc = tokens[i+1].value;
		}
		
    }
}


var disassembler_ins = [' HLT', ' LV register int_point', ' LV register register', ' LV int_point register', ' LV register register_point', ' LV register_point register', ' ADD register int', ' ADD register register', ' SUB register int', ' SUB register register', ' MUL register int', ' MUL register register', ' DIV register int', ' DIV register register', ' MOD register int', ' MOD register register', ' AND register int', ' AND register register', ' XOR register int', ' XOR register register', ' OR register int', ' OR register register', ' LS register int', ' LS register register', ' RS register int', ' RS register register', ' PSH int', ' PSH register', ' POP register', ' CMP register  int', ' CMP register  register', ' JMP int', ' JG int', ' JL int', ' JEQ int', ' JNE int', ' CALL int', ' CALL register', ' COW', ' RTI', ' RET',' LV register int']






//console.log(lexer(code));
//console.log(secondpass(lexer(code)));
//console.log(thirdpass(secondpass(lexer(code))));






function assembler(){
	ram = [];
	flag_r =0;
	for(i= 0; i< 13; i++){
		reg_file[i] = 0;
	}

	reg_file[7] = 0x5000;
	var code = `
	.BYTE "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
	.BYTE "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
	.BYTE "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
	.BYTE "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
	.BYTE "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
	.BYTE "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
	.BYTE "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
	.BYTE "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
	.BYTE "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
	.BYTE "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
	.BYTE "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
	.BYTE "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
	.BYTE "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
	.BYTE "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
	.BYTE "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
	.BYTE "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
	.ORG 0x5000
  
	`;
	ipc=0;
	code += "\n" +document.getElementById("asm").value;
	code_gen(thirdpass(secondpass(lexer(code))));
	console.log(thirdpass(secondpass(lexer(code))));
	console.log(ram);
}