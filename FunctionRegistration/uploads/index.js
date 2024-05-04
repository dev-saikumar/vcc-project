
var express=require('express');

var app=express();


app.get('/hello',(req,res)=>{
    console.log("hello route invoked");
    res.status(200)
    res.send("This is hello route");
})

app.get('/',(req,res)=>{
    console.log("helloworld requested");
    res.send("Hello from example");
});

app.listen(8080,()=>{
    console.log("server started running at 8080\n");
});