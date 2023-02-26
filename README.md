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
What makes this language diffrent than regular C?
- this language only allows the usage of pointers
- structs can only be used as pointers.
- I've removed for statements.
