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
var productTable = new Table({
  head: ["ID", "Product", "Department", "Price Each", "In Stock"],
  colWidths: [5,30,20,15,10]
});// end productTable

var lowTable = new Table({
  head: ["ID", "Product", "Department", "In Stock", "Min Qty"],
  colWidths: [5,30,20,15,10]
});// end lowTable

var purchaseTable = new Table({
  head: ["ID", "Product", "In Stock", "Min Qty"],
  colWidths: [5,30,15,10]
});// end purchaseTable

function menu(){
  purchaseTable.length = 0;
  lowTable.length = 0;
  productTable.length = 0;
  inquire.prompt([
    {
      type: "list",
      message: "Welcome, what would you like to do today?",
      choices: ["View Products", "Add New Item", "View Low Inventory", "Add to Inventory", "Sign Out"],
      name: "choice"
    }// end choice{}
  ])//end inquire.prompt()
  .then(function(response){
    if(response.choice === "View Products"){
      viewProducts();
    } else if(response.choice === "Add New Item"){
      addItem();
    } else if(response.choice === "View Low Inventory"){
      viewLowInventory();
    } else if(response.choice === "Add to Inventory"){
      addToInventory();
    }else if(response.choice === "Sign Out"){
      signOut();
    }// end if/else()
  });// end inquire.then()
}// end menu()

function viewLowInventory(){
  connection.query("SELECT * FROM products WHERE ROP >= stock_quantity", function(err, data){
//    console.log(data);
    for (var i = 0; i < data.length; i++){
      lowTable.push([data[i].item_id, data[i].product_name, data[i].department_name, data[i].stock_quantity, data[i].ROP]);
    }
    console.log(lowTable.toString());
    menu();
  });// end connection.query()
}// end viewLowInventory()

function viewProducts(){
connection.query("SELECT * FROM products ORDER BY department_name, product_name", function(err, data){
    if(err)throw err;
    for (var i = 0; i < data.length; i++){
      productTable.push([data[i].item_id, data[i].product_name, data[i].department_name, data[i].price, data[i].stock_quantity]);
    }// end for()
    console.log(productTable.toString());
    menu();
  });// end connection.query()
}// end viewProducts()

function addToInventory(){
  var poTable = new Table({
    head: ["Product", "In Stock", "Min Qty"],
    colWidths: [30,15,10]
  });// end purchaseTable
  selectedPartID = 0;
  selectedPart = "";
  selectedPartOldQty = 0;
  selectedPartNewQty = 0;
  connection.query("SELECT * FROM products", function(err, data){
    if(err)throw err;
    for (var i = 0; i < data.length; i++){
      purchaseTable.push([data[i].item_id, data[i].product_name, data[i].stock_quantity, data[i].ROP]);
    }
    console.log(purchaseTable.toString());
    inquire.prompt([
      {
        type:"list",
        message:"What would you like to buy more of?",
        choices: function(){
          var itemArr = [];
          for (var i = 0; i < data.length; i++){
            itemArr.push(data[i].product_name);
          }
          return itemArr;
        },
        name: "product"
      }// end product{}
    ])// end inquire.prompt()
    .then(function(response){
      selectedPart = response.product;
      connection.query("SELECT * FROM products WHERE product_name = ?", response.product, function(err, data){
        poTable.push([data[0].product_name, data[0].stock_quantity, data[0].ROP]);
        selectedPartID = data[0].item_id;
        selectedPartOldQty = data[0].stock_quantity;
        console.log("");
        console.log(poTable.toString());
        console.log("Old qty is " + selectedPartOldQty);
        inquire.prompt([
          {
            type:"input",
            message:"How many more would you like to buy?",
            name:"qtyToBuy",
            validate: function(value) {
              if (isNaN(value) === false) {
                return true;
              } else {
                return false;
              }// end if/else()
            }// end validate()
          }// end qtyToBuy()
        ])//end inquirer.prompt()
        .then(function(response){
          console.log("You said to add " + response.qtyToBuy);
          selectedPartNewQty = parseInt(selectedPartOldQty) + parseInt(response.qtyToBuy);
          console.log("That gives a new total of " + selectedPartNewQty);
          connection.query(
            "UPDATE products SET ? WHERE ?",
            [{
              stock_quantity: selectedPartNewQty
            },
            {
              item_id: selectedPartID
            }]
          );
          purchaseTable.pop();
          menu();
        });//end inquirer.prompt.then()
      });// end connection.query()
    });//end inquirer.prompt.then()
  });// end query
}// end addToInventory()

function signOut(){
  console.log("Thank You, now go get your workers in line. I saw Billy Bob smoking behind the dumpster!");
  connection.end();
}// end signOut();

function addItem(){
  connection.query("SELECT name FROM departments ORDER BY name", function(err, data){
    if(err) throw err;
  inquire.prompt([
    {
      type: "input",
      message: "What product would you like to add?",
      name: "newProduct"
    },
    {
      type: "list",
      message: "What department does this belong in?",
      choices: function(){
        var deptArray = [];
        for (var i = 0; i < data.length; i++){
          deptArray.push(data[i].name);
        }
        return deptArray;
      },
      name: "department"
    },
    {
      type: "input",
      message: "How much will you sell this for?",
      name: "salePrice"
    },
    {
      type: "input",
      message: "How many are we buying to start with?",
      name: "initQty"
    },
    {
      type: "input",
      message: "At what point should we reorder?",
      name: "reorderPoint"
    }
  ]) // end prompt()
    .then(function(response){
      connection.query(
        "INSERT INTO products SET ?",
        {
          product_name: response.newProduct,
          department_name: response.department,
          price: response.salePrice,
          stock_quantity: response.initQty,
          ROP: response.reorderPoint
        },
        function(err) {
          if (err) throw err;
          console.log("The new product was added to your inventory.");
          menu();
        }
      );
      // });
    });// end then()
  });// end query.connection()
}// end addItem()





// Application Start
menu();