import EventHandlerInterface from "../../../@shared/event/event-handler.interface";
import CustomerAddressChangedEvent from "../customer-address-changed.event";

export default class WriteConsoleLogWhenAddressIsChangedHandler 
  implements EventHandlerInterface<CustomerAddressChangedEvent> 
{
  handle(event: CustomerAddressChangedEvent): void {
    console.log(`Endereço do cliente: ${event.eventData.id}, ${event.eventData.nome} alterado para: ${event.eventData.address.toString()}`);
  }
}