const { request } = require('express')
const express = require ('express')
const cors = require('cors')
var bodyParser = require('body-parser');
const airtable = require('airtable');
const base = new airtable({ apiKey: "keyxAPEC4r0HPZG7B" }).base("appBTUuiZnBrMczf1");
var crypto = require('crypto');
var nodemailer = require('nodemailer');


//-----------------------------------------------------------------------------------

const app = express()
const port = process.env.PORT || 3000;

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'BarterBooksIndia@gmail.com',
    pass: 'xyzabc222@'
  }
});

app.use(
    cors({
      // var originArray=["https://praveshgarg.github.io/LoginSignUp.html","https://praveshgarg.github.io/Account.html","https://praveshgarg.github.io/BooksBarter.html","https://praveshgarg.github.io/MyPosts.html"]
      origin: "https://praveshgarg.github.io/LoginSignUp.html",
  
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  
      optionsSuccessStatus: 200,
  
    })    
  )

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies


//---------------------------------------------------------------------------------------------------


app.get('/', (req, res) => {
  res.send('Hello World!')
})


//----------------------------------------- Login/SignUp js code---------------------------------------------------
app.post('/login', function(req, res){
    let email =  req.body.email;
    let password = req.body.password;
    //console.log(req.headers.cookie);

    checkLoginCredentialsfromdatabase().then(function (result) {
        if (result.length > 0) {    
          
          // create token
          var salt = crypto.randomBytes(16).toString('hex');
          var token = crypto.pbkdf2Sync(result[0].id, salt, 1000, 64, 'sha512').toString('hex');              

          //encrypting password             
          var hashPassword = crypto.pbkdf2Sync(password, result[0].fields.Salt, 1000, 64, 'sha512').toString('hex');
          if(hashPassword===result[0].fields.Password){ 
            res.send([result[0].id, "BooksBarter.html?City="+encodeURIComponent(result[0].fields.City), token, result[0].fields.FirstName+" "+result[0].fields.LastName]);                                       
            
            //store token in login table
            base('UserLogins').update([
              {
                "id": result[0].id,
                "fields": {                  
                  "Token": token,                
                }
              }            
            ], function(err, records) {            
            });
          }
          else{
            res.send("");          
          }
        }
        else {
          res.send("");          
        }                
    })
            
    function checkLoginCredentialsfromdatabase() {
        return  base('UserLogins').select({
          filterByFormula: '{EmailId} = "'+email+'"',
        }).all();        
    }      
});


app.post('/signup', function(req, res){
  let email =  req.body.email;
  let password = req.body.password;
  let firstname = req.body.firstname;
  let lastname = req.body.lastname;
  let mobile = req.body.mobile;
  let city = req.body.city;
  let address = req.body.address;
  // encrypting password and email 
  var salt = crypto.randomBytes(16).toString('hex');            
  var hashPassword = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');     
  
  

  checkEmailExistsInDatabase().then(function (result) {    
      if (result.length <= 0) {
        // create token  
        var token = crypto.pbkdf2Sync(result[0].id, salt, 1000, 64, 'sha512').toString('hex');

        base('UserLogins').create({ "EmailId": email, "Password": hashPassword, "Salt": salt, "FirstName":firstname, "LastName":lastname, "Mobile":mobile, "City":city, "Address":address, "Token":token}, function (err, record) {
          res.send([record.id,"BooksBarter.html?City="+encodeURIComponent(city),token, firstname+" "+ lastname]);          
          });                           
      }
      else {
        res.send("");        
      }                
  })
          
  function checkEmailExistsInDatabase() {
      return  base('UserLogins').select({
        filterByFormula: '{EmailId} = "'+email+'"',
      }).all();        
  }      
});


app.post('/ForgotPassword', function(req, res){
  let email =  req.body.email;       
  
  checkEmailExistsInDatabase().then(function (result) {    
      if (result.length > 0) {                

          //generate otp
          var digits = '0123456789';
          let otp = '';
          for (let i = 0; i < 4; i++) {
            otp += digits[Math.floor(Math.random() * 10)];
          }                    
        
        
        base('UserLogins').update([
          {
            "id": result[0].id,
            "fields": {
              "OTP": otp,                            
            }
          }            
        ], function(err, records) {   
          res.send("success");         
        });

        var mailOptions = {
          from: 'barterbooksandgames@gmail.com',
          to: email,
          subject: 'Barter Books And Games Otp',
          html: '<p>Hello Customer, <br> The otp for your forgot pasword request is ' + otp + '.<br> Kindly do not respond back to this email.</p>'
        }
        
        transporter.sendMail(mailOptions, function(error, info){          
        });

      }
      else {
        res.send("");        
      }                
  })
          
  function checkEmailExistsInDatabase() {
      return  base('UserLogins').select({
        filterByFormula: '{EmailId} = "'+email+'"',
      }).all();        
  }      
});


app.post('/SubmitOtp', function(req, res){
  let email =  req.body.email;       
  let otp =  req.body.otp;       

  checkEmailExistsInDatabase().then(function (result) {    
      if (result.length > 0) {                                                    
        
        base('UserLogins').update([
          {
            "id": result[0].id,
            "fields": {
              "OTP": "true",                            
            }
          }            
        ], function(err, records) {   
          res.send("success");         
        });        

      }
      else {
        res.send("");        
      }                
  })
          
  function checkEmailExistsInDatabase() {
      return  base('UserLogins').select({
        filterByFormula: 'AND({EmailId} = "'+email+'", {OTP} = "'+otp+'")',
      }).all();        
  }      
});


app.post('/ResetPassword', function(req, res){
  let email =  req.body.email;
  let password = req.body.password;
  // encrypting password and email 
  var salt = crypto.randomBytes(16).toString('hex');            
  var hashPassword = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');   
  
  checkEmailExistsInDatabase().then(function (result) {    
      if (result.length > 0) { 
        //create token
        var token = crypto.pbkdf2Sync(result[0].id, salt, 1000, 64, 'sha512').toString('hex');

        res.send([result[0].id,"BooksBarter.html?City="+encodeURIComponent(result[0].fields.City), token,  result[0].fields.FirstName+" "+result[0].fields.LastName]);                                 
          
          base('UserLogins').update([
            {
              "id": result[0].id,
              "fields": {
                "EmailId": email,
                "Password": hashPassword,
                "Salt": salt, 
                "Token": token,
                "OTP":"",               
              }
            }            
          ], function(err, records) {            
          });
      }
      else {
        res.send("");        
      }                
  })
          
  function checkEmailExistsInDatabase() {
      return  base('UserLogins').select({
        filterByFormula: 'AND({EmailId} = "'+email+'", {OTP} = "true")',
      }).all();        
  }      
});






//--------------------------------------------- BookBarter js code ----------------------------------------------------------

app.post('/PostBooksAdData', function(req, res){    
  let UserId = req.body.UserId;
  let token = req.body.Token;  
  base('UserLogins').find(UserId, function(err, record){
  
  if(record.fields.Token == token) {       
    base('PostBooksAd').create({ "UserId": req.body.UserId, "BookName": req.body.BookName, "BookType": req.body.BookType, "TextLanguage": req.body.TextLanguage, "Author": req.body.Author, "BookLink": req.body.BookLink, "Description": req.body.Description, "BookInterestedIn": req.body.BookInterestedIn}, function (err, record) {      
      });  
      res.send(["Ad posted successfully.","#93c90e"]);     
    }
    else{
      res.send(["Session expired. Kindly re-login to continue.","IndianRed"])
    }
  })                      
});


app.post('/CityBooksData', function(req, res){
  let city = req.body.City;
  let UserId =  req.body.Userid;
  let token =  req.body.Token;      
  
  let UserLoginsData;
  let ContactStatusData;
  base('UserLogins').find(UserId, function(err, record){
  
  if(record.fields.Token == token){   

    getCityData().then(function (result) {
      UserLoginsData = result;
      
      return base('ContactStatus').select({
        filterByFormula: 'OR({ContactFrom} = "'+UserId+'", {ContactTo} = "'+UserId+'")',    
      }).all();

    }).then(function (result) { 
      ContactStatusData = result;
      
      return base('PostBooksAd').select({  
        filterByFormula: '{UserId} != "'+UserId+'"',    
      }).all();

    }).then(function (result){    
      
      var dataArray = [];
      
      for(var i=0; i<result.length; i++){
        for(var j=0; j<UserLoginsData.length; j++){
          if(UserLoginsData[j].id==result[i].fields.UserId){
            var status="";
            var tempContactStatusId=""
            //checking contact status
            for(var k=0; k<ContactStatusData.length; k++){
              if(ContactStatusData[k].fields.ContactTo == UserLoginsData[j].id){
                status = ContactStatusData[k].fields.Status;
              }
              else if(ContactStatusData[k].fields.ContactFrom == UserLoginsData[j].id && ContactStatusData[k].fields.Status == "Waiting"){
                status = "Approve";
                tempContactStatusId = ContactStatusData[k].id;
              }
              else if(ContactStatusData[k].fields.ContactFrom == UserLoginsData[j].id){
                status = ContactStatusData[k].fields.Status;
              }
            }
            if(status==""){
              dataArray.push(["",result[i].fields.BookName,result[i].fields.BookType,result[i].fields.TextLanguage,result[i].fields.Author,result[i].fields.BookLink,result[i].fields.Description,result[i].fields.BookInterestedIn,UserLoginsData[j].fields.Address,UserLoginsData[j].fields.FirstName+ " " + UserLoginsData[j].fields.LastName, "Contact Button", UserLoginsData[j].id, ""]);      
            }
            else if(status == "Waiting"){
              dataArray.push(["",result[i].fields.BookName,result[i].fields.BookType,result[i].fields.TextLanguage,result[i].fields.Author,result[i].fields.BookLink,result[i].fields.Description,result[i].fields.BookInterestedIn,UserLoginsData[j].fields.Address,UserLoginsData[j].fields.FirstName+ " " + UserLoginsData[j].fields.LastName, "Waiting", UserLoginsData[j].id, ""]);      
            }
            else if(status == "Approved"){
              dataArray.push(["",result[i].fields.BookName,result[i].fields.BookType,result[i].fields.TextLanguage,result[i].fields.Author,result[i].fields.BookLink,result[i].fields.Description,result[i].fields.BookInterestedIn,UserLoginsData[j].fields.Address,UserLoginsData[j].fields.FirstName+ " " + UserLoginsData[j].fields.LastName, UserLoginsData[j].fields.Mobile, UserLoginsData[j].id, ""]);      
            }
            else if(status == "Approve"){
              dataArray.push(["",result[i].fields.BookName,result[i].fields.BookType,result[i].fields.TextLanguage,result[i].fields.Author,result[i].fields.BookLink,result[i].fields.Description,result[i].fields.BookInterestedIn,UserLoginsData[j].fields.Address,UserLoginsData[j].fields.FirstName+ " " + UserLoginsData[j].fields.LastName, "Approve", UserLoginsData[j].id, tempContactStatusId]);      
            }

          }
        }       
      }
      res.send(dataArray);
    })

    
    function getCityData(){     
      return base('UserLogins').select({
        filterByFormula: '{City} = "'+city+'"',
      }).all();        
    }   
  }
  else{
    res.send("");
  }
})
});


app.post('/ContactButtonClicked', function(req, res){  
  let UserId1 =  req.body.UserId1;      
  let UserId2 =  req.body.UserId2;
  let token =  req.body.Token;      
    
  base('UserLogins').find(UserId1, function(err, record){
  
  if(record.fields.Token == token) {   
    CheckContactStatusData().then(function (result) {
      if(result.length>0){
        res.send(["Refresh the page and then proceed","IndianRed"]);
      }
      else{
        base('ContactStatus').create({ "ContactFrom": UserId1, "ContactTo": UserId2, "Status": "Waiting"}, function (err, record) {
          res.send(["Contacted successfully. Waiting for the person's approval to show his/her mobile number","#93c90e"]);          
          });
      }
    })    
     
    function CheckContactStatusData(){
      return base('ContactStatus').select({
        filterByFormula: 'AND({ContactFrom} = "'+UserId2+'", {ContactTo} = "'+UserId1+'")',    
      }).all();
    }

  }
  else{
    res.send(["Session expired. Kindly re-login to continue.","IndianRed"]);
  }
  })
  
});


app.post('/ApproveRequest', function(req, res){  
  let UserId1 =  req.body.UserId1;
  let UserId2 =  req.body.UserId2;
  let adId = req.body.adId;     
  let token = req.body.Token;  

  base('UserLogins').find(UserId1, function(err, record){
  
  if(record.fields.Token == token) {                  
      base('ContactStatus').update([
        {
          "id": adId,
          "fields": {
            "Status": "Approved"
          }
        }
      ], function (err, records) {
        if(err){
          res.send(["Refresh the page and then proceed","IndianRed"]);   
        }
        else{
          res.send(["Approved exchange number request successfully.","#93c90e"]);   
        }
      });  
    }
    else{
      res.send(["Session expired. Kindly re-login to continue.","IndianRed"]);
    }
  });
});





//***********************************  MyPosts js functions   ************************************************************

app.post('/MyBookPostsData', function(req, res){  
  let UserId =  req.body.Userid;      
  let token = req.body.Token;  
  base('UserLogins').find(UserId, function(err, record){
  
  if(record.fields.Token == token) {
    getCityData().then(function (result) { 
      var dataArray = [];
      for(var i=0; i<result.length; i++){
        dataArray.push([result[i].id,result[i].fields.BookName,result[i].fields.BookType,result[i].fields.TextLanguage,result[i].fields.Author,result[i].fields.BookLink,result[i].fields.Description,result[i].fields.BookInterestedIn]);      
      }       
      res.send(dataArray);
    })
    
    function getCityData(){
      return base('PostBooksAd').select({
        filterByFormula: '{UserId} = "'+UserId+'"',      
      }).all();        
    } 
  }
  else{
    res.send("");
  }  
  
  });
});


app.post('/GetEditMyPostData', function(req, res){
  let adId =  req.body.adId;  
  let UserId =  req.body.Userid;      
  let token = req.body.Token;  
  base('UserLogins').find(UserId, function(err, record){
  
  if(record.fields.Token == token) {      
    base('PostBooksAd').find(adId, function(err, record) {
      res.send([record.fields.BookName,record.fields.BookType,record.fields.TextLanguage,record.fields.Author,record.fields.BookLink,record.fields.Description,record.fields.BookInterestedIn]);
    })
  }
  else{
    res.send("");
  }
  })
})


app.post('/EditMyPostBooksAdData', function(req, res){  
  let UserId =  req.body.Userid;      
  let token = req.body.Token;  
  base('UserLogins').find(UserId, function(err, record){
  
  if(record.fields.Token == token) {                  
      base('PostBooksAd').update([
        {
          "id": req.body.adId,
          "fields": {
            "BookName": req.body.BookName, "BookType": req.body.BookType, "TextLanguage": req.body.TextLanguage, "Author": req.body.Author, "BookLink": req.body.BookLink, "Description": req.body.Description, "BookInterestedIn": req.body.BookInterestedIn
          }
        }
      ], function (err, records) {
        if(err){
          res.send(["Data edit failed","IndianRed"]);   
        }
        else{
          res.send(["Data edited successfully.","#93c90e"]);   
        }
      });  
    }
    else{
      res.send(["Session expired. Kindly re-login to continue.","IndianRed"]);
    }
  });
});


app.post('/DeleteMyPostData', function(req, res){
  let AdId =  req.body.AdId; 
  let UserId =  req.body.Userid;      
  let token = req.body.Token;  
  base('UserLogins').find(UserId, function(err, record){
  
  if(record.fields.Token == token) {
    base('PostBooksAd').destroy([AdId], function(err, deletedRecords) {
      if (err) {
        res.send(["Delete ad failed","IndianRed"]);        
      }
      else{
      res.send(["Ad deleted successfully.","#93c90e"]);    
      }
    });
  }
  else{
    res.send(["Session expired. Kindly re-login to continue.","IndianRed"]);
  }
    });
})





//********************************* Account page code *************************************************/
app.post('/GetAccountDetails', function(req, res){
  let UserId =  req.body.Userid;    
  let token = req.body.Token;  
  base('UserLogins').find(UserId, function(err, record){
  
  if(record.fields.Token == token) {      
    base('UserLogins').find(UserId, function(err, record) {
      res.send([record.fields.FirstName,record.fields.LastName,record.fields.Mobile,record.fields.City,record.fields.Address,record.fields.EmailId]);
    })
  }
  else{
    res.send("")
  }
})
  })


app.post('/EditAccountDetails', function(req, res){
  let UserId =  req.body.UserId;  
  let firstname = req.body.firstname;
  let lastname = req.body.lastname;
  let mobile = req.body.mobile;
  let city = req.body.city;
  let address = req.body.address;  
  let token = req.body.Token;  
  base('UserLogins').find(UserId, function(err, record){
  
  if(record.fields.Token == token) {
  base('UserLogins').update([
    {
      "id": UserId,
      "fields": {
        "FirstName": firstname,
        "LastName": lastname,
        "Mobile": mobile,  
        "City": city,
        "Address": address              
      }
    }            
  ], function(err, records) {    
    if(err){
      res.send(["Edit account failed","IndianRed"]);
    }        
    else{
      res.send(["Account edited successfully.","#93c90e"]);
    }
  });
}
else{
  res.send(["Session expired. Kindly re-login to continue.","IndianRed"]);  
}
  })
  })


app.post('/ChangePassword', function(req, res){
  let UserId =  req.body.UserId;
  let OldPassword = req.body.OldPassword;
  let NewPassword = req.body.NewPassword;           
  let token = req.body.Token;  
  base('UserLogins').find(UserId, function(err, record){
  
  if(record.fields.Token == token) {
    base('UserLogins').find(UserId, function(err, record) {
      var hashOldPassword = crypto.pbkdf2Sync(OldPassword, record.fields.Salt, 1000, 64, 'sha512').toString('hex');     
      if(hashOldPassword==record.fields.Password){
        var salt = crypto.randomBytes(16).toString('hex');            
        var hashNewPassword = crypto.pbkdf2Sync(NewPassword, salt, 1000, 64, 'sha512').toString('hex');     
        base('UserLogins').update([
          {
            "id": UserId,
            "fields": {
              "Password": hashNewPassword,
              "Salt": salt,                            
            }
          }            
        ], function(err, records) {    
          if(err){
            res.send(["Change password failed.","IndianRed"]);
          }        
          else{
            res.send(["Password changed successfully.","#93c90e"]);
          }
        });
      }
      else{
        res.send(["Incorrect Password"])
      }
    })       
  }
  else{
    res.send("")
  }  
})  
});



app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

