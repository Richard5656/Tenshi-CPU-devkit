// copy and paste this and include a main function. to use the small libC
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


BYTE free(WORD ptr){
	if((BYTE) *(ptr+(WORD)*(ptr-4))  == 0){
		
		(BYTE) *(ptr-4) = ((BYTE) *(ptr-4)) + (WORD) *(ptr+(WORD)*(ptr-4)+1);
	}
            (BYTE) *(ptr-5) = 0;
}