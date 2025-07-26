import { Sequelize } from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a new order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("123", "123", [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });

  it("should update an existing order", async () => {
    // step 1 - mocks
    const customer = new Customer("customerId1", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    const customerRepository = new CustomerRepository();
    await customerRepository.create(customer);

    const product = new Product("productId1", "productName", 10);
    const productRepository = new ProductRepository();
    await productRepository.create(product);

    const orderItem = new OrderItem("itemId1", "itemName", product.price, product.id, 1);

    const order = new Order("orderId1", customer.id, [orderItem]);
    const orderRepository = new OrderRepository();
    await orderRepository.create(order);
    
    // step 2 - update order
    const product2 = new Product("productId2", "productName2", 16);
    await productRepository.create(product2);

    const orderItem2 = new OrderItem("itemId2", "itemName2", product2.price, product2.id, 2);

    order.changeItems([orderItem, orderItem2]);
    await orderRepository.update(order);

    // step 3 - find order
    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });
    
    // step 4 - verify
    expect(orderModel.toJSON()).toStrictEqual({
      id: order.id,
      customer_id: order.customerId,
      total: order.total(),
      items: [
        {
          id: order.items[0].id,
          name: order.items[0].name,
          price: order.items[0].price,
          quantity: order.items[0].quantity,
          order_id: order.id,
          product_id: order.items[0].productId,
        },
        {
          id: order.items[1].id,
          name: order.items[1].name,
          price: order.items[1].price,
          quantity: order.items[1].quantity,
          order_id: order.id,
          product_id: order.items[1].productId,
        }
      ]
    })
  });

  it("should find a order", async () => {
    // step 1 - mocks
    const customer = new Customer("customerId1", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    const customerRepository = new CustomerRepository();
    await customerRepository.create(customer);

    const product = new Product("productId1", "productName", 10);
    const productRepository = new ProductRepository();
    await productRepository.create(product);

    const orderItem = new OrderItem("itemId1", "itemName", product.price, product.id, 1);

    const order = new Order("orderId1", customer.id, [orderItem]);
    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    // step 2 - find order
    const orderResult = await orderRepository.find(order.id);
    
    // step 3 - verify
    expect(orderResult).toStrictEqual(order);
  });

  it("should find all orders", async () => {
    // step 1 - mocks
    const customer = new Customer("customerId1", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);

    const customer2 = new Customer("customerId2", "Customer 2");
    const address2 = new Address("Street 2", 2, "Zipcode 2", "City 2");
    customer2.changeAddress(address2);

    const customerRepository = new CustomerRepository();
    await customerRepository.create(customer);
    await customerRepository.create(customer2);
    
    const product = new Product("productId1", "productName", 10);
    const productRepository = new ProductRepository();
    await productRepository.create(product);
    
    const orderItem = new OrderItem("itemId1", "itemName", product.price, product.id, 1);
    const orderItem2 = new OrderItem("itemId2", "itemName2", product.price, product.id, 2);

    const order = new Order("orderId111", customer.id, [orderItem]);
    const order2 = new Order("orderId222", customer2.id, [orderItem2]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);
    await orderRepository.create(order2);
    

    // step 2 - find order
    const orderResult = await orderRepository.findAll();

    console.log(orderResult);
    
    
    // step 3 - verify
    expect(orderResult).toHaveLength(2);
    expect(orderResult).toContainEqual(order);
    expect(orderResult).toContainEqual(order2);
  });
});
