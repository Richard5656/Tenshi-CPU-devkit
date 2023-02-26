direct = IMM28

0x00 LV reg,direct
0x01 LV reg,[Mem]
0x02 LV reg,reg
0x03 LV [Mem],reg
0x04 LV reg,[reg]
0x05 LV [reg],reg

0x06 ADD reg,direct
0x07 ADD reg,reg
0x08 SUB reg,direct
0x09 SUB reg,reg
0x0a MUL reg,direct
0x0b MUL reg,reg
0x0c DIV reg,direct
0x0d DIV reg,reg
0x0e MOD reg,direct
0x0f MOD reg,reg
0x10 AND reg,direct
0x11 AND reg,reg
0x12 XOR reg,direct
0x13 XOR reg,reg
0x14 OR reg,direct
0x15 OR reg,reg
0x16 LS reg,direct
0x17 LS reg,reg
0x18 RS reg,direct
0x19 RS reg,reg
0x1a PSH direct
0x1b PSH reg
0x1C POP reg

0x1d CMP reg, direct
0x1d CMP reg, reg

0x1f JMP direct
0x20 JG direct
0x21 JL direct
0x22 JEQ direct
0x23 JNE direct
0x24 CALL direct
0x25 CALL reg
0x26 COW direct
0x27 RTI direct
0x28 RET direct

modifier or mode:
    0x00 - byte op
    0x01 - double byte op
    0x02 - word operation 



instruction anatomy: 1 byte instruction, 1 byte modifier, 28 bit operand, 28 bit operand <- 72 bit instructions

A <- Acummulator
B <- General purpose 1 
C <- General purpose 2
D <- General purpose 3
PXD1 <- index register 1
PXD2 <- index register 2
PXD3 <- index register 3
PC  <- Program counter
SP  <- stack pointer
BP  <- base pointer
VTP <- vector table pointer
ISPC <- interrupt return address
Flags <- cannot be accesed directly. This may change


COW is the interrupt instruction




