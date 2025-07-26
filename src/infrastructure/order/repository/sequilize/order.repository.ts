import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {
	async create(entity: Order): Promise<void> {
		await OrderModel.create(
			{
				id: entity.id,
				customer_id: entity.customerId,
				total: entity.total(),
				items: entity.items.map((item) => ({
					id: item.id,
					name: item.name,
					price: item.price,
					product_id: item.productId,
					quantity: item.quantity,
					order_id: entity.id
				})),
			},
			{
				include: [{ model: OrderItemModel }],
			}
		);
	}

	async update(entity: Order): Promise<void> {
		let sequelize = OrderModel.sequelize

		await sequelize.transaction(async (t) => {
			await OrderModel.update(
				{
					customer_id: entity.customerId,
					total: entity.total()
				},
				{
					where: { id: entity.id },
					transaction: t
				}
			);

			await OrderItemModel.destroy({ 
				where: { order_id: entity.id },
				transaction: t
			});

			const items = entity.items.map((item) => ({
				id: item.id,
				name: item.name,
				price: item.price,
				product_id: item.productId,
				quantity: item.quantity,
				order_id: entity.id
			}));

			await OrderItemModel.bulkCreate(items, { transaction: t });

		});
	}

	async find(id: string): Promise<Order> {
		let orderModel: OrderModel;
		let orderItems: OrderItem[] = [];
		
		try {
			orderModel = await OrderModel.findOne({
				where: {id},
				include: [{model: OrderItemModel}],
				rejectOnEmpty: true
			});
		} catch (error) {
			throw new Error("Order not found");
		}

		orderModel.items.forEach((item) => {
			let orderItem = new OrderItem(item.id, item.name, item.price, item.product_id, item.quantity);
			orderItems.push(orderItem)
		});

		return new Order(
			id, 
			orderModel.customer_id, 
			orderItems
		)
	}

	async findAll(): Promise<Order[]> {
		const orderModels = await OrderModel.findAll({ include: [{model: OrderItemModel}] });

		const orders = orderModels.map((orderModel) => {
			
			const items: OrderItem[] = orderModel.items.map((itemModel) => {
				return new OrderItem(
					itemModel.id,
					itemModel.name,
					itemModel.price,
					itemModel.product_id,
					itemModel.quantity
				);
			});

			return new Order(
				orderModel.id,
				orderModel.customer_id,
				items
			);
		});

		return orders;
	}
}
