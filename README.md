# Tenshi-runtime-devkit


The sucessor of JS-24-Bit-CPU and an overall better version. 



It includes:
<p>
  -A custom version of C
  <br>
  -An assembler
  <br>
  -A very small minimal libC
  <br>
</p>
 
 
 
```C
//an example hello world
//without libC

WORD hello_world ="Hello World!!!"; // a pointer to the string hello world 
WORD main(){
    WORD s = 0;
    
    while((BYTE)*(s+hello_world) != 0 ){
        (BYTE) *(s) = (BYTE)*(s+hello_world); // sets the MMIO location 0 to the ascii code C
    }
}
```

Questions:
What makes this language diffrent than ANSI C?
- This language only allows the usage of pointers and you cannot use arrays.
- structs can not be used to create varibles
- I've removed for statements
- Pointer arithmatic is not offseted by the size of their type. Ex. ```(DBYTE) *(90+12)``` is not the same as ```*(90+12*2)```
- There is no memory protection. (Meaning you could write a program which sole purpose is to corrupt itself)
- I hereby claim that ";" should now be called Dot Commas and not Semicolons.

Where does the name come from?

The name Tenshi comes from the Japanese name for angel. 
This could be taken in multiple directions. 
I was inspired to name this language that because it was part of the name of the song I was listening too when developing 40% of this project. 
The song in question is tenshi fureta yo by K-ON!. You could also protray this language as sort of a Fanon to Angel Beat's Angel player. 
Or even a tribute to HolyC and Terry A Davis.

But this name fit's perfectly because you could replace C with shi to pronounce it TenC.
