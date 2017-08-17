// Alert
console.log("bamazonCustomer.js opened");

// Requires
var mysql = require("mysql");
var inquire = require("inquirer");
var fs = require("fs");
var Table = require("cli-table");
var joi = require("joi");

// Initial Values
var table = new Table({
  head: ["ID", "Product", "Department", "Price Each", "In Stock"],
  colWidths: [5,30,20,15,10]
});// end table

var productTable = new Table({
  head: ["Product", "Price Each", "In Stock"],
  colWidths: [30,15,10]
});// end productTable

var connection = mysql.createConnection({
  host: "localhost",
  port: "3306",
  user: "root",
  password: "root",
  database: "bamazon"
});//end connection()

var cart = [];

connection.connect(function(err){
  if(err) throw err;
  console.log("Connected. Your ID is " + connection.threadId);
});//end connection.connect()

function menu(){
  inquire.prompt([
    {
      type: "list",
      message: "Welcome, what would you like to do today?",
      choices: ["Search Store", "Sign Out"],
      name: "choice"
    }// end choice{}
  ])//end inquire.prompt()
  .then(function(response){
    if(response.choice === "Search Store"){
      searchStore();
    } else if(response.choice === "Sign Out"){
      signOut();
    }
  })// end inquire.then()
}// end menu()

function signOut(){
  console.log("Thank you for choosing Bamazon. We will see you again soon!");
  connection.end();
}

function searchStore(){
  console.log("seachStore() ran");
  selectedPartID = 0;
  selectedPart = "";
  selectedPartDept = "";
  selectedPartDeptID = 0;
  selectedPartPrice = 0;
  selectedPartOldQty = 0;
  selectedPartNewQty = 0;
  selectedPartDeptOldSales = 0;
  selectedPartDeptNewSales = 0;
  connection.query("SELECT * FROM products ORDER BY department_name, product_name", function(err, data){
    if(err)throw err;
    for (var i = 0; i < data.length; i++){
      table.push([data[i].item_id, data[i].product_name, data[i].department_name, data[i].price, data[i].stock_quantity]);
    }
    console.log(table.toString());
    inquire.prompt([
      {
        type:"list",
        message:"What would you like to buy?",
        choices: function(){
          var itemArr = [];
          for (var i = 0; i < data.length; i++){
            itemArr.push(data[i].product_name);
          }
          return itemArr;
        },
        name: "product"
      }// end addToCart{}
    ])// end inquire.prompt()
    .then(function(response){
      selectedPart = response.product;
      connection.query("SELECT * FROM products WHERE product_name = ?", response.product, function(err, data){
        selectedPartID = data[0].item_id;
        selectedPartDept = data[0].department_name;
        selectedPartOldQty = data[0].stock_quantity;
        selectedPartPrice = data[0].price;
        productTable.push([data[0].product_name, data[0].price, data[0].stock_quantity]);
        connection.query("SELECT * FROM departments WHERE name = ?", selectedPartDept, function(err, data){
          selectedPartDeptID = data[0].id;
          selectedPartDeptOldSales = data[0].total_sales;
        });
        var maxQty = data[0].stock_quantity;
        console.log("");
        console.log(productTable.toString());
        console.log("");
        inquire.prompt([
          {
            type:"input",
            message:"How many would you like to buy?",
            name:"qtyToCart",
            validate: function(value) {
              if (isNaN(value) === false) {
                if(maxQty >= value){
                    return true;
                } else {
                  console.log(" ... Insufficient Quantity. I only have " + maxQty);
                  return false;
                }
              }
              return false;
            }
          }// end qtyToCart()
        ])//end inquirer.prompt()
        .then(function(response){
          var longPrice = selectedPartPrice * response.qtyToCart;
          var totalPrice = longPrice.toFixed(2);
          selectedPartNewQty = parseInt(maxQty) - parseInt(response.qtyToCart);
          selectedPartDeptNewSales = parseFloat(selectedPartDeptOldSales) + parseFloat(totalPrice);
          console.log("Thank you for your purchase. I am still building a cart option but don't worry, the internet has your card information. I will just charge it");
          console.log(`Your total for your purchase is $${totalPrice}.`);
          connection.query(
            "UPDATE products SET ? WHERE ?",
            [{
              stock_quantity: selectedPartNewQty
            },
            {
              item_id: selectedPartID
            }]
          );
          connection.query(
            "UPDATE departments SET ? WHERE ?",
            [{
              total_sales: selectedPartDeptNewSales
            },
            {
              id: selectedPartDeptID
            }]
          )
          productTable.pop();
          menu();
        });//end inquirer.prompt.then()
      });// end connection.query()
    });//end inquirer.prompt.then()
  });// end query
}// end searchStore()

menu();