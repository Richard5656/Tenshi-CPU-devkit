//ram filesystem is Just a tree
//files and tex editor hasn't been implmented yet.

struct folder_node{
    WORD name;
    WORD parent;
    WORD contents; // a pointer to a vector of pointers that point to folder_ptr
    WORD ammt; // ammount of stuff in this folder aka the size of contents in bytes
};

struct file_node{
    WORD name;
    WORD contents; // a pointer to a vector which stores the contents of a file
    WORD size; // size of file
};



WORD scr_ptr =967;//points to places on the screen. //like cursor pointer 
WORD keyboard_buffer_pointer = 0;  // points to where the keyboard writes


WORD enter_flag = 0; // whenever enter is pressed this flag is set.
WORD line_break = 64; // how much to add for a line break in the thing
BYTE keyboard_write_buffer =  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

WORD root_node_ptr =0; // File system root node pointer //setup_files()
WORD current_directory = 0; // it is the pointer to the current folder location you are in


WORD current_keyboard_mode = 0; //0 means shell //1 means notepad like application

BYTE main(){
				setup_files(); // set up flash memory mmio

				setup_irq(); // set up irqs 
                clear_scr(); // clear screen 
                clear_kbd_buffer(); // clear keyboard buffer
				keyboard_buffer_pointer=$keyboard_write_buffer;
				
				append_folder("Neoga");
append_folder("gNeo");
				append_folder("se");
				ls();
				
}

BYTE setup_files(){
    root_node_ptr = fmalloc((size folder_node));//sets up root node as a pointer to vectors;
    current_directory = root_node_ptr;
	(struct folder_node) (root_node_ptr).name = "root";
	(struct folder_node) (root_node_ptr).contents =  fmallocv(4);
	(struct folder_node) (root_node_ptr).parent =  root_node_ptr;
        (struct folder_node) (root_node_ptr).ammt =  0;
}

BYTE append_folder(WORD name){ // appends file or folder // filesize of 0 is a folder
    WORD fp =fmalloc((size folder_node));
    (struct folder_node) (fp).name =  name; 
    (struct folder_node) (fp).parent =  current_directory;
    (struct folder_node) (fp).contents =  fmallocv(4);
    (struct folder_node) (root_node_ptr).ammt =  (struct folder_node) (root_node_ptr).ammt+4;

    (struct folder_node) (current_directory).contents = freallocvw((struct folder_node) (current_directory).contents,fp);


}


BYTE setup_irq(){
                //set up keyboard drivers // that IRQ
                asm_d("LV VTP,0x2FFFFFF");
				asm_d("LV D, #irqA");
				asm_d("LV WORD [VTP], D");
				asm_d("JMP #IRQ_end");
				
				
				asm_d("LABEL irqA");
				keyboard_handler();
				asm_d("RTI");
				
				
				
				asm_d("LABEL IRQ_end");
}

BYTE ls(){ // list files in directory
	WORD de = 0;
	WORD cur_fp_p = 0; // current file folder pointer

	while(de<(struct folder_node) (current_directory).ammt){

		cur_fp_p = (struct folder_node) current_directory.contents+de;
		strcpy(0,(struct folder_node) ((WORD)*cur_fp_p).name);
                de = de+4;
		
	}
//strcpy(0, (WORD) *((WORD) *((struct folder_node) current_directory.contents)));
//return (WORD) *((WORD) *((struct folder_node) current_directory.contents));


}



BYTE clear_scr(){
	
	memset(0,32,1024);
	
	strcpy(0,"Tenshi operating system");
	strcpy(64,(struct folder_node) current_directory.name);
	strcpy(960,"SHELL\>");
}

BYTE clear_scr_just_the_bottom_part(){ // shell area
	memset(960,32,1024);
	strcpy(960,"SHELL\>");
}


BYTE print_A_test(){
	WORD s = 64;
	while(s<512){
			(BYTE) *(s) = 65;
			s=s+1;
	}
}


BYTE clear_kbd_buffer(){
	memset($keyboard_write_buffer,0,64);
}

BYTE command_parse(){ // parses the shell commands 




	//sets all 32's in memory to 0's

	WORD de = 0;
	while((BYTE)*($keyboard_write_buffer+de) != 0){
		if((BYTE)*($keyboard_write_buffer+de) == 32){
			(BYTE)*($keyboard_write_buffer+de) = 0;
		 }
		de = de+1;
	}


	if(strcmp($keyboard_write_buffer,"help") == 0){
		strcpy(64,"You dont get any help. ");
		asm_d("JMP #end_command_parse");
	}
	if(strcmp($keyboard_write_buffer,"clear") == 0){
		clear_scr();
		asm_d("JMP #end_command_parse");
	}
	
	if(strcmp($keyboard_write_buffer,"test") == 0){
		if(strcmp(str_arr_ind($keyboard_write_buffer,1),"f") == 0){
			print_A_test();
		}
		asm_d("JMP #end_command_parse");
	}
	

	
	if(strcmp($keyboard_write_buffer,"stab") == 0){
		
		(BYTE) *( stoi(str_arr_ind($keyboard_write_buffer,1))) = stoi(str_arr_ind($keyboard_write_buffer,2));
		asm_d("JMP #end_command_parse");
	}
    
	if(strcmp($keyboard_write_buffer,"fstab") == 0){
		
		memset( 
            stoi(str_arr_ind($keyboard_write_buffer,1)),
        stoi(str_arr_ind($keyboard_write_buffer,2)),
            stoi(str_arr_ind($keyboard_write_buffer,3))
        );
		asm_d("JMP #end_command_parse");
	}
	strcpy(64,"Invalid command");
	
	asm_d("LABEL end_command_parse");
	
	
}

BYTE keyboard_handler(){
			if((BYTE) *(0x1000) != 13){
			   if((BYTE) *(0x1000) !=8){  
			   
				       (BYTE) *(keyboard_buffer_pointer) = (BYTE) *(0x1000);
						keyboard_buffer_pointer = keyboard_buffer_pointer+1;
						(BYTE)*(keyboard_buffer_pointer) = 95;
						
			   }
			}


		   if((BYTE) *(0x1000) == 13){ // enter
				
				clear_scr_just_the_bottom_part();
				(BYTE)*(keyboard_buffer_pointer) = 0;
				command_parse();
				clear_kbd_buffer();
				keyboard_buffer_pointer = $keyboard_write_buffer;
				
		   }
		   
		
		if((BYTE) *(0x1000) == 8){ // backspace
			   keyboard_buffer_pointer = keyboard_buffer_pointer-1;
				   (BYTE)*(keyboard_buffer_pointer+1) = 32;
			   (BYTE) *(keyboard_buffer_pointer) = 32;
			   //not ideal
			   //buffer fix using hax
			   
			(BYTE)*(keyboard_buffer_pointer) = 95;
		}
		if(keyboard_buffer_pointer < $keyboard_write_buffer){keyboard_buffer_pointer=$keyboard_write_buffer; }
keyboard_buffer_pointer = (keyboard_buffer_pointer % $keyboard_write_buffer)+$keyboard_write_buffer;
	    strcpy(scr_ptr,$keyboard_write_buffer);

}



BYTE strcmp(WORD str,WORD strp){
       WORD cond = strlen(str) ^ strlen(strp);
       WORD de = 0;
       while(de <strlen(str)){
           cond = cond + ((BYTE) * (str+de)) ^ ((BYTE) * (strp+de));
           de = de +1;
       }
       return cond;
}



BYTE memset(WORD dest,WORD c, WORD ammt){
         WORD de = dest;
       while(de<(dest+ammt)){
            (BYTE) *(de) = c;
            de = de +1;
       }
}

BYTE memcpy(WORD src,WORD dest, WORD ammt){
         WORD de = 0;
       while(de<ammt){
            (BYTE) *(de+dest) = (BYTE) *(de+src);
            de = de +1;
       }

}

BYTE strcpy(WORD dest,WORD src){
        WORD de = 0;

       while((BYTE) *(de+src) != 0 ){
            (BYTE) *(de+dest) = (BYTE) *(de+src);
            de = de +1;
       }
    

}


BYTE str_arr_ind(WORD str_ptr,WORD index){
	WORD de = 0;
	WORD int_ind = 0;
	while(int_ind != index){
		while((BYTE)*(str_ptr+de) != 0){
			de = de+1;
		}
		while((BYTE)*(str_ptr+de) == 0){
			de = de+1;
		}
		int_ind= int_ind+1;
	}
	return de+str_ptr;
}


BYTE strlen(WORD src){
        WORD len = 0;
       while((BYTE) *(len+src) != 0 ){
                  len = len +1;
       }
       return len;
}


BYTE pow(WORD base, WORD exp){
	WORD de = 1;
	WORD result = base;
	
	while(de<exp){
		result = result *base;
		de = de +1;
	}
	return result;
}


BYTE stoi(WORD str_ptr){
    WORD string_length = strlen(str_ptr);
    WORD de =0;
    WORD final_num = 0;
    while(de < string_length){

       final_num = final_num + (((BYTE)*(str_ptr+de)) ^48) * pow(10,(string_length -de));


       de = de+1;
    }
return final_num/10;
}



BYTE atoi(WORD num){
    WORD buffer = "18446744073709551616";
      WORD dnum = num;
    WORD i=1;
      WORD buf_len = strlen(buffer);
    while(i < buf_len){
              (BYTE) *(buffer + buf_len - i) = dnum % 10;
              (BYTE) *(buffer + buf_len - i) = 48 ^ (BYTE)*(buffer + buf_len - i);
              dnum = dnum / 10;
              i = i + 1;
    }
      (BYTE) *(buffer + buf_len - i) = dnum % 10;
      (BYTE) *(buffer + buf_len - i) = 48 ^ (BYTE)*(buffer + buf_len - i);
      dnum = dnum / 10;
      i = i + 1;
return buffer;
}

BYTE clrscr(){
      memset(0,32,1024);
}






BYTE malloc(WORD tsize){
      WORD i =0;
      WORD k =0;
      WORD heap_loc = 0x01FFFFF;

       while((BYTE) *(heap_loc+i) == 1){
             

            if((BYTE) *(heap_loc+i) == 0){
                        (BYTE)*(k) = 90;
                        k=k+1;
                        if( 0 == (WORD) *(heap_loc+i+1)){
                          asm_d("JMP #break_malloc");

                        }
                        if( tsize < (WORD) *(heap_loc+i+1)){
                          asm_d("JMP #break_malloc");
                        }
            }
		i = ((WORD) *(heap_loc+i+1)) + i;
    }
      asm_d("LABEL break_malloc");
      (BYTE) *(heap_loc+i) = 1;
      (WORD) *(heap_loc+i+1) = tsize+5;
       return heap_loc+i+5;
}







BYTE realloc(WORD ptr,WORD tsize){
          WORD new_blk = malloc(tsize);
          WORD mov_ammt = ((WORD) *(ptr-4))-5;
		  memcpy(ptr,new_blk,mov_ammt);
		  free(ptr);
return new_blk;
}



BYTE mallocv(WORD siz_t){ //dynamically allocate a vector
    WORD blk_ptr = malloc(siz_t+4);
    (WORD) *(blk_ptr) = siz_t;
   return blk_ptr+4;
}

BYTE reallocv(WORD ptr_blk,WORD siz_t){
    WORD blk_ptr = realloc(ptr_blk-4,((WORD)*(ptr_blk-4))+siz_t+4);
    (WORD) *(blk_ptr) = ((WORD)*(ptr_blk))+siz_t;
return blk_ptr+4;
}






BYTE fmalloc(WORD tsize){ // allocates files in the file heap // can be used for regular allocations. Not recomended though
      WORD i =0;
      WORD k =0;
      WORD heap_loc = 0x3FFFFFF; // this is the file heap location

       while((BYTE) *(heap_loc+i) == 1){
             

            if((BYTE) *(heap_loc+i) == 0){
                        (BYTE)*(k) = 90;
                        k=k+1;
                        if( 0 == (WORD) *(heap_loc+i+1)){
                          asm_d("JMP #break_fmalloc");

                        }
                        if( tsize < (WORD) *(heap_loc+i+1)){
                          asm_d("JMP #break_fmalloc");
                        }
            }
		i = ((WORD) *(heap_loc+i+1)) + i;
    }
      asm_d("LABEL break_fmalloc");
      (BYTE) *(heap_loc+i) = 1;
      (WORD) *(heap_loc+i+1) = tsize+5;
       return heap_loc+i+5;
}

BYTE freallocv(WORD ptr_blk,WORD siz_t){
    WORD blk_ptr = frealloc(ptr_blk-4,((WORD)*(ptr_blk-4))+siz_t+4);
    (WORD) *(blk_ptr) = ((WORD)*(ptr_blk))+siz_t;
return blk_ptr+4;
}

BYTE freallocvw(WORD ptr_blk,WORD val){  // realloc append a singular word named val to the heap
    WORD blk_ptr = frealloc(ptr_blk-4,((WORD)*(ptr_blk-4))+4);
    (WORD) *(blk_ptr) = ((WORD)*(ptr_blk))+8;
	(WORD) *(blk_ptr+4) = val; 
return blk_ptr+4;
}




BYTE fmallocv(WORD siz_t){ //dynamically allocate a vector in file space

    WORD blk_ptr = fmalloc(siz_t+4);
    (WORD) *(blk_ptr) = siz_t;

   return blk_ptr+4;
   
}
BYTE frealloc(WORD ptr,WORD tsize){
          WORD new_blk = fmalloc(tsize);
          WORD mov_ammt = ((WORD) *(ptr-4))-5;
		  memcpy(ptr,new_blk,mov_ammt);
		  free(ptr);
return new_blk;
}



BYTE freev(WORD ptr){
            free(ptr-4);
}


BYTE free(WORD ptr){
	if((BYTE) *(ptr+(WORD)*(ptr-4))  == 0){
		
		(BYTE) *(ptr-4) = ((BYTE) *(ptr-4)) + (WORD) *(ptr+(WORD)*(ptr-4)+1);
	}
            (BYTE) *(ptr-5) = 0;
}



