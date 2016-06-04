"use strict";var Sha256={};Sha256.hash=function(a){a=a.utf8Encode();var b=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298],c=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225];a+=String.fromCharCode(128);for(var d=a.length/4+2,e=Math.ceil(d/16),f=new Array(e),g=0;e>g;g++){f[g]=new Array(16);for(var h=0;16>h;h++)f[g][h]=a.charCodeAt(64*g+4*h)<<24|a.charCodeAt(64*g+4*h+1)<<16|a.charCodeAt(64*g+4*h+2)<<8|a.charCodeAt(64*g+4*h+3)}f[e-1][14]=8*(a.length-1)/Math.pow(2,32),f[e-1][14]=Math.floor(f[e-1][14]),f[e-1][15]=8*(a.length-1)&4294967295;for(var j,k,l,m,n,o,p,q,i=new Array(64),g=0;e>g;g++){for(var r=0;16>r;r++)i[r]=f[g][r];for(var r=16;64>r;r++)i[r]=Sha256.\u03c31(i[r-2])+i[r-7]+Sha256.\u03c30(i[r-15])+i[r-16]&4294967295;j=c[0],k=c[1],l=c[2],m=c[3],n=c[4],o=c[5],p=c[6],q=c[7];for(var r=0;64>r;r++){var s=q+Sha256.\u03a31(n)+Sha256.Ch(n,o,p)+b[r]+i[r],t=Sha256.\u03a30(j)+Sha256.Maj(j,k,l);q=p,p=o,o=n,n=m+s&4294967295,m=l,l=k,k=j,j=s+t&4294967295}c[0]=c[0]+j&4294967295,c[1]=c[1]+k&4294967295,c[2]=c[2]+l&4294967295,c[3]=c[3]+m&4294967295,c[4]=c[4]+n&4294967295,c[5]=c[5]+o&4294967295,c[6]=c[6]+p&4294967295,c[7]=c[7]+q&4294967295}return Sha256.toHexStr(c[0])+Sha256.toHexStr(c[1])+Sha256.toHexStr(c[2])+Sha256.toHexStr(c[3])+Sha256.toHexStr(c[4])+Sha256.toHexStr(c[5])+Sha256.toHexStr(c[6])+Sha256.toHexStr(c[7])},Sha256.ROTR=function(a,b){return b>>>a|b<<32-a},Sha256.\u03a30=function(a){return Sha256.ROTR(2,a)^Sha256.ROTR(13,a)^Sha256.ROTR(22,a)},Sha256.\u03a31=function(a){return Sha256.ROTR(6,a)^Sha256.ROTR(11,a)^Sha256.ROTR(25,a)},Sha256.\u03c30=function(a){return Sha256.ROTR(7,a)^Sha256.ROTR(18,a)^a>>>3},Sha256.\u03c31=function(a){return Sha256.ROTR(17,a)^Sha256.ROTR(19,a)^a>>>10},Sha256.Ch=function(a,b,c){return a&b^~a&c},Sha256.Maj=function(a,b,c){return a&b^a&c^b&c},Sha256.toHexStr=function(a){for(var c,b="",d=7;d>=0;d--)c=a>>>4*d&15,b+=c.toString(16);return b},"undefined"==typeof String.prototype.utf8Encode&&(String.prototype.utf8Encode=function(){return unescape(encodeURIComponent(this))}),"undefined"==typeof String.prototype.utf8Decode&&(String.prototype.utf8Decode=function(){try{return decodeURIComponent(escape(this))}catch(a){return this}}),"undefined"!=typeof module&&module.exports&&(module.exports=Sha256),"function"==typeof define&&define.amd&&define([],function(){return Sha256});