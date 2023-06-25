
var debug_flag = 0; // 1 is debug mode
var comment_flag = 0; // 1 shows comments of the compiler
var strlit_counter = 0;
function debug_print(e){
      if(debug_flag == 1){
            console.trace();
            console.log(e);
      }
}

var tokens_c = ["size","if","while","for","else","BYTE","DBYTE","WORD","asm_d","return","struct","#w","#b","#d","#fup"];
var symbols_c = "(){}[]-+*<>/%&^=$!;.".split("");
var mul_sym_c = [">","<","=","!","+","-"];

var text_sect = ".ORG 0x2000000\n";


var expr_sym = ["+","-"];
var term_sym = ["*","/","^","%","&","|",">>","<<"];
var digits_c = "01234456789".split("");
var hex_c = "xABCDEF".split("");
var size_match= {"BYTE":1,"DBYTE": 2, "WORD": 4};
var sizs= ["BYTE","DBYTE", "WORD"];
function lexer_c(c_code){
    let toks = [];
    let buffer = "";
    for(let index = 0; index< c_code.length;index++){
        if(c_code[index] == '/' && c_code[index+1] == '/'){
            index+=2;
            while(c_code[index] != "\n"){
                index++;
            }
        }
        if(c_code[index] == ' ' ||
            c_code[index] == '\n'||
            c_code[index] == '\t'||
            c_code[index] == ','){
            if(buffer.length  != 0){
                toks.push({name:buffer,type:"ident"});
                buffer = "";
            }
                continue;
            }
          
        if(symbols_c.includes(c_code[index])&&buffer.length  != 0){
                toks.push({name:buffer,type:"ident"});
                buffer = "";
        }
        buffer += c_code[index];
        if(tokens_c.includes(buffer)){
                toks.push({name:buffer,type:"keyword"});
                buffer = "";
        }
        if(symbols_c.includes(buffer)){

            if(mul_sym_c.includes(c_code[index+1]) && c_code[index] != '(' && c_code[index] != ')' ){
                index++;
                buffer += c_code[index];
                toks.push({name:buffer,type:"symbol"});
            }else{
                toks.push({name:buffer,type:"symbol"});
            }
            buffer = "";
        }
        if(c_code[index] == '"'){
            index++;
            buffer = "";
            while(c_code[index] != '"'){
                buffer += c_code[index];
                index++;
            }
            toks.push({name:buffer,type:"str_lit"});
            buffer = "";
        }
        if(digits_c.includes(buffer)){
            index++;
            while(digits_c.includes(c_code[index]) || hex_c.includes(c_code[index])){
                buffer += c_code[index];
                index++;
            }
            index--;
            toks.push({name:buffer,type:"int_lit"});
            buffer = "";
        }
    }
    return toks;
}


var indp = 0;
var label_counter = 0;
var sym_table = {};
var bpo_scp = {};//base pointer offset for sccopes//holds the base pointer offsets
var asm_code = "";

function match(s){
    if(toks_c[indp].name == s){
        indp+=1;
    }else{
        console.log("MATCH err: "+ s);
            console.log("MATCH what got: "+ toks_c[indp].name);
        indp+=1;
            throw new Error("Match err");
    }
}

function lookahead(offset){
    return toks_c[indp+offset].name;
}
function curtok(){
    return toks_c[indp].name;
}
function expt(s){
    asm_code+=s+"\n";
}


function expt_c(s){
    if(comment_flag == 1){
            expt(s);
      }
}

function struct_decl_pacg(){
        while(curtok() == "struct"){
            match("struct");
            let name = curtok();
            indp++;
            let ibpo = 0; // internal bpo
            sym_table[name]={
                type:"struct",
                scope:"struct",
                sym_table:{}// stores offsets and such
            };
            match("{");
            while(sizs.includes(curtok())){
                 let siz = curtok();
                 indp++;
                 sym_table[name].sym_table[curtok()] = {type: siz, bpo:ibpo};
                 ibpo+=size_match[siz];
                 indp++;
                 match(";");
            }
            sym_table[name].ibpo = ibpo;
            match("}");
            match(";");
        }
}



function decl_pacg(scope){
    if(scope == "program"){//in program not in any function
        while(lookahead(2) == "=" &&sizs.includes(curtok())){
            let siz = curtok();
            indp++;
            sym_table[curtok()] = {type:siz,scope:"global"};
			
			if(toks_c[indp+2].type == "int_lit"){
				text_sect += "\nLABEL "+ curtok() +"\n";
				indp+=2;
				text_sect += "."+siz+  " " + curtok() +"\n";
				indp++;
			}else if(toks_c[indp+2].type == "str_lit"){
				text_sect += "\nLABEL "+ curtok() +"\n";
				indp+=2;
				text_sect += "."+siz+  " \"" + curtok() +"\",0\n";
				indp++;	
			}
            match(";");
        }
    }else{
      
      
      
      
      
      
        if(lookahead(2) == "=" && sizs.includes(curtok()) ){
            let siz = curtok();
            indp++;
            expt_c(";local variblec decl");
			let exists = sym_table[curtok()+"_"+scope] != undefined;
            if(!exists) sym_table[curtok()+"_"+scope] = {type:siz,scope:"local",bpo: bpo_scp[scope]};
			let ident = curtok();
            indp++;
            match("=");
            expt("LV PXD3,BP");
                  if(!exists) expt("SUB PXD3, " + bpo_scp[scope]);
				  if(exists) expt("SUB PXD3, " + sym_table[ident+"_"+scope]["bpo"])
                  expt("PSH PXD3");
            expr_pacg(scope);
            expt("POP A");
                  expt("POP PXD3");
            expt("LV " + siz + " [PXD3], A");
          
           if(!exists) bpo_scp[scope]+=size_match[siz];
            match(";");
        }
      
      
      
      
      
      
    }
}


function func_pacg(){
    let siz = curtok();
    indp++; // skips byte, dbyte, word
      expt_c(";function decl");
    expt("LABEL "+ curtok());
	sym_table[curtok()] = {type:siz,scope:"global"};
    let func_name = curtok();
    indp++;
    match("(");
   bpo_scp[func_name] = 0;
  
    let par_c = 0; //param counter
    let par_b = []; // param names for doing parsing stuff
    while(curtok() != ")"){
        let siz = curtok();
        indp++;
        par_b.push(curtok()+"_"+func_name);
        sym_table[curtok()+"_"+func_name] = {type:siz,scope: "param",bpo:par_c};
        indp++;
        par_c+=4;
    }
    for(let i =0; i< par_b.length; i++){
        sym_table[par_b[i]].bpo = par_c - sym_table[par_b[i]].bpo;
    }
    match(")");
      expt("LV BP,SP");
    expt("SUB SP, 4096");
    block_pacg(func_name);
    expt("ADD SP, 4096");
     
    expt("RET");
}





function bool_for_pacg(scope){ //bool parse for "for"
    expt_c(";boolean for pacg")
    expr_pacg(scope);
    let cond = curtok();
    indp++;
    expr_pacg(scope);
    expt("POP A");
    expt("POP C");
    expt("CMP A,C");
    return cond;
}



function bool_pacg(scope){
      expt_c(";boolean pacg")
    match("(");
    expr_pacg(scope);
    let cond = curtok();
    indp++;
    expr_pacg(scope);
    expt("POP A");
    expt("POP C");
    expt("CMP A,C");
    match(")");
    return cond;
}


function mutate_pacg(scope){
                        expt_c(";Mutate a varible");
                let isparam = false;
                let islocal = (sym_table[curtok() + "_" + scope] != undefined);
                if(islocal){
                    isparam = (sym_table[curtok() + "_" + scope].scope == "param");
                }
                let symb = sym_table[curtok() + "_" + scope]; // sym buffer
                let siz = "";
                if(isparam){
                    console.log("No params");
                }else if(islocal){
                    expt("LV PXD3, BP");
                    expt("SUB PXD3, "+ symb.bpo)
					expt("PSH PXD3");
                    indp++;
                    siz = symb.type;
                }else if(sym_table[curtok()] && sym_table[curtok()].scope == "global"){
                    siz = sym_table[curtok()].type;
                    expt("LV PXD3, #"+curtok());
					expt("PSH PXD3");
                    indp++;
                }
  
    return siz;
}


function inc_dec_pacg(scope,mode){
	                        expt_c(";inc or dec a varible");
                let isparam = false;
                let islocal = (sym_table[curtok() + "_" + scope] != undefined);
                if(islocal){
                    isparam = (sym_table[curtok() + "_" + scope].scope == "param");
                }
                let symb = sym_table[curtok() + "_" + scope]; // sym buffer

                if(isparam){
                    console.log("No params");
                }else if(islocal){
					siz = symb.type;
                    expt("LV PXD3, BP");
                    expt("SUB PXD3, "+ symb.bpo)
					expt("LV A, "+ siz + " [PXD3]");
					indp++;					
					if(curtok() == "++"){
						match("++");
						expt("ADD A, 1");
					}else if(curtok() == "--"){
						match("--");
						expt("SUB A, 1");
					}
					
					expt("LV " + siz + " [PXD3], A");
					if(mode == "expr") expt("PSH A");
                }else if(sym_table[curtok()] && sym_table[curtok()].scope == "global"){
                    siz = sym_table[curtok()].type;
                    expt("LV PXD3, #"+curtok());
					expt("LV A, "+ siz + "[PXD3]");
					indp++;
					if(curtok() == "++"){
						match("++");
						expt("ADD A, 1");
					}else if(curtok() == "--"){
						match("--");
						expt("SUB A, 1");
					}
					
					expt("LV " + siz + "[PXD3], A");
					if(mode == "expr") expt("PSH A");
                }
}


function block_pacg(scope){
      expt_c("; begining of block");
    match("{");
    while(curtok() != "}"){
        if(curtok() == "("){
            indp++;
            if(sizs.includes(curtok())){ // cast for pointer
                indp--;
                let cast = cast_pacg();   
                match("*");
                expr_pacg(scope);
                match("=");
                       
                expr_pacg(scope);
                expt("POP A");
                        expt("POP PXD2");
                expt("LV " +cast[0]+ " [PXD2], A");
                match(";");
            }else if(curtok() == "struct"){ //structure cast
                indp--;
                let cast = cast_pacg();
              
                expr_pacg(scope);
                match(".");
                expt("POP PXD1");
                expt("ADD PXD1, " + sym_table[cast[1]].sym_table[curtok()].bpo);
                let siz = sym_table[cast[1]].sym_table[curtok()].type;
                indp++;
                match("=");
                expr_pacg(scope);
                expt("POP A");
                expt("LV " + siz +" [PXD1] , A");
                match(";");
            }
        }else if(curtok() == "if"){// if
			if_pacg(scope);
        }else if(curtok() == "while"){//while
            match("while");
            let label_counter_buffer = label_counter;
			label_counter++;
            let temp_ind = indp; // this is a buffer to store the location of the condition
            while(curtok() != '{'){indp++;}
            expt("JMP #_L"+label_counter_buffer);
            expt("LABEL L" + label_counter_buffer);
            block_pacg(scope);
            let temp_ind1 = indp;
            indp=temp_ind;
            expt("LABEL _L" + label_counter_buffer);
            let cond = bool_pacg(scope);
            if(cond == "<"){
                    expt("JL #L"+label_counter_buffer);
            }else if(cond == ">"){
                    expt("JG #L"+label_counter_buffer);
            }else if (cond == "=="){
                    expt("JEQ #L"+label_counter_buffer);
            }else if(cond == "!="){
                    expt("JNE #L"+label_counter_buffer);
            }
            
            indp= temp_ind1;
            }else if(curtok() == "for"){
				match("for");

				let label_counter_buffer = label_counter;
				label_counter++;
				match("(");
				decl_pacg(scope);
				let temp_ind = indp; // this is a buffer to store the location of the condition

				while(curtok() != '{'){indp++;}
				expt("JMP #_L"+label_counter_buffer);
				expt("LABEL L" + label_counter_buffer);
				block_pacg(scope);
				let temp_ind1 = indp;
				indp=temp_ind;
				while(curtok() != ';'){indp++;}
				match(";");
				inc_dec_pacg(scope,"block");
				expt("LABEL _L" + label_counter_buffer);
				indp=temp_ind;
				
				let cond = bool_for_pacg(scope);
				if(cond == "<"){
						expt("JL #L"+label_counter_buffer);
				}else if(cond == ">"){
						expt("JG #L"+label_counter_buffer);
				}else if (cond == "=="){
						expt("JEQ #L"+label_counter_buffer);
				}else if(cond == "!="){
						expt("JNE #L"+label_counter_buffer);
				}
				
				indp= temp_ind1;
			}else if(toks_c[indp].type == "ident"){
              if(lookahead(1) == "++" || lookahead(1) == "--"){
				inc_dec_pacg(scope,"block");
			  }else if(lookahead(1) == "("){
                    func_call_pacg(scope);
                    match(";");
                }else if(lookahead(1) == "="){ //mutate a varible
                    let siz =mutate_pacg(scope);
                    match("=")
                    expr_pacg(scope);
                    expt("POP A");
					expt("POP PXD3");
                    expt("LV " +siz +" [PXD3], A");
                    match(";");
                }
            }else if(curtok() == "return"){
                match("return");
                expr_pacg(scope);
                expt("POP A");
                match(";");
            }else if(curtok() == "asm_d"){
                match("asm_d");
                match("(");
                expt(curtok());
                indp++;
                match(")");
                match(";")
            }else if(curtok() == "#fup"){

				match("#fup");
				expr_pacg(scope);
				match(".")
				expt("POP D");
				func_call_expr_pacg(scope);
				match(";");
			}else if(sizs.includes(curtok())){
                decl_pacg(scope);
            }else if(curtok() == ";"){
                match(";");
            }
          
        }
     match("}");
    
 }
	
	
function if_pacg(scope){
	            match("if");
                let label_counter_buffer = label_counter;
				label_counter++;
                let cond = bool_pacg(scope);
                if(cond == "<"){
                    expt("JG #L"+label_counter_buffer);
                }else if(cond == ">"){
                    expt("JL #L"+label_counter_buffer);
                }else if (cond == "=="){
                    expt("JNE #L"+label_counter_buffer);
                }else if(cond == "!="){
                    expt("JEQ #L"+label_counter_buffer);
                }
                block_pacg(scope);
				expt("LABEL L"+ label_counter_buffer);
				if(curtok() == "else" && lookahead(1) == "if"){
					match("else");
					if_pacg(scope);
				} else if(curtok() == "else"){
					match("else");
					block_pacg(scope);
				}
}





function func_call_expr_pacg(scope){
      expt_c(";function call expr")

      expt("PSH PXD1");
      expt("PSH PXD2");
      expt("PSH PXD3");
    match("(");
    let amm_p = 0;
    while(curtok() != ")"){
        expr_pacg(scope);
        amm_p++;
    }

    match(")");
    expt("CALL D");
    expt("ADD SP, " + amm_p*4);
      expt("POP PXD3");
      expt("POP PXD2");
      expt("POP PXD1");
}
function func_call_pacg(scope){
      expt_c(";function call")
    let call_name = curtok();
      expt("PSH PXD1");
      expt("PSH PXD2");
      expt("PSH PXD3");
    indp++;
    match("(");
    let amm_p = 0;
    while(curtok() != ")"){
        expr_pacg(scope);
        amm_p++;
    }

    match(")");
    expt("CALL #" + call_name);
    expt("ADD SP, " + amm_p*4);
      expt("POP PXD3");
      expt("POP PXD2");
      expt("POP PXD1");
}



function program_pacg(){
      expt_c("; Main Start")
    expt("LV SP, 0x0FFFFF0");
    expt("CALL #main");
    expt("HLT");
    struct_decl_pacg();
    decl_pacg("program");
    while(indp < toks_c.length&&sizs.includes(curtok())){
        func_pacg();
        expt("HLT");
    }
    expt("HLT");
}

function expr_pacg(scope){
     
   expt_c(";Expr pacg");
    term_pacg(scope);
    while(curtok() == '+' || curtok() == '-'){
        if(curtok() == '+'){
            indp++;
            term_pacg(scope);
            expt("POP C");
            expt("POP A");
            expt("ADD A, C");
            expt("PSH A");
        }else if(curtok() == '-'){
            indp++;
            term_pacg(scope);
            expt("POP C");
            expt("POP A");
            expt("SUB A, C");
            expt("PSH A");
        }
    }
}
//var term_sym = ["*","/","^","%","&","|",">>","<<"];
function term_pacg(scope){
  
    factor_pacg(scope);
    while(term_sym.includes(curtok())){
        if(curtok() == '*'){
            indp++;
            factor_pacg(scope);
            expt("POP C");
            expt("POP A");
            expt("MUL A, C");
            expt("PSH A");
        }else if(curtok() == '/'){
            indp++;
            factor_pacg(scope);
            expt("POP C");
            expt("POP A");
            expt("DIV A, C");
            expt("PSH A");
        }else if(curtok() == '%'){
            indp++;
            factor_pacg(scope);
            expt("POP C");
            expt("POP A");
            expt("MOD A, C");
            expt("PSH A");
        }else if(curtok() == '^'){
            indp++;
            factor_pacg(scope);
            expt("POP C");
            expt("POP A");
            expt("XOR A, C");
            expt("PSH A");
        }else if(curtok() == '&'){
            indp++;
            factor_pacg(scope);
            expt("POP C");
            expt("POP A");
            expt("AND A, C");
            expt("PSH A");
        }else if(curtok() == '|'){
            indp++;
            factor_pacg(scope);
            expt("POP C");
            expt("POP A");
            expt("AND A, C");
            expt("PSH A");
        }else if(curtok() == ">>"){
            indp++;
            factor_pacg(scope);
            expt("POP C");
            expt("POP A");
            expt("RS A, C");
            expt("PSH A");
        }else if(curtok() == "<<"){
            indp++;
            factor_pacg(scope);
            expt("POP C");
            expt("POP A");
            expt("LS A, C");
            expt("PSH A");
        }
    }
}


function cast_pacg(){
    let siz = "";
    let ident = "";//identifier for struct
    let pointer = 0;//0 is not a pointer  // 1 is a pointer
    match("(");
    if(sizs.includes(curtok()) ){
            siz = curtok();
            indp++;
    }else if(curtok() ==  "struct"){
        siz = curtok();
        indp++;
        ident = curtok();
        indp++;
    }
    match(")");
    return [siz,ident];
}


function factor_pacg(scope){
     
    if(toks_c[indp].type == "int_lit"){
            expt_c(";int_lit pacg");
            expt("PSH " + curtok());
        indp++;
    }else if(curtok() == "("){
        if(sizs.includes(lookahead(1))){
            let pointer = cast_pacg();
            if(curtok() == "*"){
                    match("*");
                    expr_pacg(scope);
                    expt("POP PXD1");
                    expt("LV A,"+ pointer[0]+" [PXD1]");
                    expt("PSH A");
            }
        }else if(lookahead(1) == "struct"){
            let cast = cast_pacg();
              
                expr_pacg(scope);
                match(".");
                expt("POP PXD1");
                expt("ADD PXD1, " + sym_table[cast[1]].sym_table[curtok()].bpo);
                let siz = sym_table[cast[1]].sym_table[curtok()].type;

                expt("LV A," + siz + "[PXD1]");
                expt("PSH A");
                indp++;
                 
        }else{
            match("(");
            expr_pacg(scope);
            match(")");
        }
    }else if(toks_c[indp].type == "ident"){
           debug_print("identifier_expr_curtok_begin: " + curtok());
               debug_print("identifier_expr_indp_begin: " + indp);
            if(lookahead(1) == "("){
                expt_c(";func_expr pacg");
                        func_call_pacg(scope); // function
                expt("PSH A");
            }else if(lookahead(1) == "++" || lookahead(1) == "--"){
				inc_dec_pacg(scope,"expr");
			}else{
                //func_name+"_param"
                        console.log(sym_table[curtok() + "_" + scope]);
                        console.log(curtok());
                let isparam = false;
                let islocal = (sym_table[curtok() + "_" + scope] != undefined);
                if(islocal){
                    isparam = (sym_table[curtok() + "_" + scope].scope == "param");
                }
                let symb = sym_table[curtok() + "_" + scope]; // sym buffer
                if(isparam){
                              expt_c(";var_expr_param pacg");
                    expt("LV PXD3, BP");
                    expt("ADD PXD3, "+ (symb.bpo+12));
                    expt("LV A, "+symb.type +" [PXD3]");
                    expt("PSH A");
                    indp++;
                }else if(islocal){
                              expt_c(";local_var_expr_param pacg");
                    expt("LV PXD3, BP");
                    expt("SUB PXD3, "+ symb.bpo)
                    expt("LV A, "+symb.type +" [PXD3]");
                    expt("PSH A");
                    indp++;
                }else if(sym_table[curtok()] && sym_table[curtok()].scope == "global"){
					
                              expt_c(";global_var_expr_param pacg");
                    //expt("LV PXD3, WORD #["+curtok()+"]");
					expt("LV A,"+sym_table[curtok()].type+ " [#"+curtok()+"]");
					expt("PSH A");

                    indp++;
                }
                debug_print("identifier_expr_curtok_end: " + curtok());
                        debug_print("identifier_expr_indp_end: " + indp);
          
        }
    }else if(curtok() == "$"){ // memloc
        match("$");
      
      
        let isparam = false;
        let islocal = (sym_table[curtok() + "_" + scope] != undefined);
        if(islocal){
            isparam = (sym_table[curtok() + "_" + scope].scope == "param");
        }
        let symb = sym_table[curtok() + "_" + scope]; // sym buffer
        if(isparam){
                    expt("LV A, BP");
                    expt("ADD A, "+ (symb.bpo+12));
                    expt("PSH A");
                    indp++;
        }else if(islocal){
                    expt("LV A, BP");
                    expt("SUB A, "+ symb.bpo);
                    expt("PSH A");
                    indp++;
        }else if(sym_table[curtok()] && sym_table[curtok()].scope == "global"){
                    expt("LV A, #"+curtok());
                    expt("PSH A");
                    indp++;
        }
    }else if(curtok() == "size"){ // gets the size of a structure <- yes this is real
        match("size");
        expt("PSH "+ sym_table[curtok()].ibpo);
        
        indp++;
    }else if(curtok() == "asm_d"){
      
        match("asm_d");
        match("(");
        expt(curtok());
        indp++;
        match(")");
    }else if(toks_c[indp].type == "str_lit"){
            text_sect += "\nLABEL String_literal_" +strlit_counter +"\n"+  '.BYTE "' +curtok() + '", 0';
            expt("LV A, #String_literal_"+ strlit_counter);
            expt("PSH A");
            strlit_counter++;
            indp++;
    }else if(curtok() == "arg"){
                              match("arg");
                    expt("LV PXD3, BP");
                    expt("ADD PXD3, 12");
                              expt("PSH PXD3");
                              match("[");
                              expr_pacg(scope);
                    match("]");
                              expt("POP PXD3");
                              expt("POP C");
                              expt("ADD PXD3, C");
                              expt("LV A, WORD [PXD3]");
                    expt("PSH A");
                    indp++;
    }
  
    if(curtok() == "#b"){
      
            indp++;
            expt("POP C");
            expr_pacg(scope);
            expt("POP PXD3");
            expt("ADD PXD3, C");
            expt("LV A, BYTE [PXD3]");
            expt("PSH A");
    }else if(curtok() == "#d"){
      
            indp++;
            expt("POP C");
            expr_pacg(scope);
            expt("POP PXD3");
            expt("ADD PXD3, C");
            expt("LV A, DBYTE [PXD3]");
            expt("PSH A");
    }else if(curtok() == "#w"){
      
            indp++;
            expt("POP C");
            expr_pacg(scope);
            expt("POP PXD3");
            expt("ADD PXD3, C");
            expt("LV A, WORD [PXD3]");
            expt("PSH A");
    }
}

//WORD k = 90;
var toks_c;
var c_code;
function compile(){
    label_counter = 0;
      strlit_counter = 0;
      indp = 0;
      c_code = document.getElementById('c_code').value;
      asm_code = "";
      text_sect = ".ORG 0x2000000\n";
    bpo_scp = {};
    sym_table = {};
      toks_c =lexer_c(c_code);

      console.log(toks_c);
      program_pacg();
      console.log(JSON.stringify(sym_table,0,2));
      console.log(bpo_scp);
      asm_code += text_sect+  "\nHLT\nHLT";
      document.getElementById('asm').value = asm_code;
}
