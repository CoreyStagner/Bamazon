var mysql = require("mysql");
var inquire = require("inquirer");
var joi = require("joi");
var Table = require("cli-table2");

var connection = mysql.createConnection({
  host: "localhost",
  port: "3306",
  user: "root",
  password: "root",
  database: "bamazon"
});//end connection()

connection.connect(function(err){
  if(err) throw err;
  console.log("Connected. Your ID is " + connection.threadId);
});//end connection.connect()

// Initial Values
var table = new Table({
  head: ["ID", "Department", "Overhead", "Total Sales", "Total Profit"],
  colWidths: [5,20,20,10,10]
});// end productTable

function menu(){
  inquire.prompt([
    {
      type: "list",
      message: "Welcome, what would you like to do today?",
      choices: ["View Sales", "Add New Department", "Sign Out"],
      name: "choice"
    }// end choice{}
  ])//end inquire.prompt()
  .then(function(response){
    if(response.choice === "View Sales"){
      viewSales();
    } else if(response.choice === "Add New Department"){
      addDept();
    } else if(response.choice === "Sign Out"){
      signOut();
    }// end if/else()
  });// end inquire.then()
}// end menu()

function viewSales(){
connection.query("SELECT * FROM departments", function(err, data){
    for (var i = 0; i < data.length; i++){
      var overhead = parseInt(data[i].overhead);
      var sales = parseInt(data[i].total_sales);
      var profit = sales - overhead;
      table.push([data[i].id, data[i].name, data[i].overhead, data[i].total_sales, profit]);
    }
    console.log(table.toString());
    menu();
  });// end connection.query()
}// end viewSales()

function signOut(){
  console.log("Thank You, tell corporate we are kicking ass here!");
  connection.end();
}// end signOut();

function addDept(){
  connection.query("SELECT * FROM departments ORDER BY name", function(err, data){
    if(err) throw err;
  inquire.prompt([
    {
      type: "input",
      message: "What department are you adding?",
      name: "newDept"
    },
    {
      type: "input",
      message: "How much does it cost to run this department?",
      name: "overhead",
      validate: function(value) {
        if (isNaN(value) === false) {
          return true;
        } else {
          return false;
        }// end if/else()
      }// end validate()
    }
  ]) // end prompt()
    .then(function(response){
      connection.query(
        "INSERT INTO departments SET ?",
        {
          name: response.newDept,
          total_sales: 0,
          overhead: parseInt(response.overhead),
        },
        function(err) {
          if (err) throw err;
          console.log("The new department was added");
          menu();
        }
      );
      // });
    });// end then()
  });// end query.connection()
}// end addItem()





// Application Start
menu();