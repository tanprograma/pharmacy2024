import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { Medicine } from 'src/app/medicine';
import { MedicineService } from 'src/app/services/medicine.service';
import { of } from 'rxjs';
import { Client } from 'src/app/client';
import { Store } from 'src/app/store';
import { ClientsService } from 'src/app/services/clients.service';
import { StoreService } from 'src/app/services/store.service';
import { InventoryService } from 'src/app/services/inventory.service';
import { Inventory } from 'src/app/inventory';
import { Router } from '@angular/router';
@Component({
  selector: 'app-dispense',
  templateUrl: './dispense.component.html',
  styleUrls: ['./dispense.component.css'],
})
export class DispenseComponent implements OnInit {
  @Output() isLoading = new EventEmitter<boolean>();
  interval!: any;
  message!: string;
  available: number = 0;
  clients: Client[] = [];
  stores: Store[] = [];
  medicines: Medicine[] = [];
  dispensed: number = 0;
  uploaded: any = [];
  inventory: Inventory[] = [];
  client: string = '';
  outlet: string = '';
  payloads: {
    commodity: string;
    payload: { date?: number; client: string; quantity: number };
  }[] = [];
  medicine: string = '';
  requested = 0;
  loading: boolean = false;

  constructor(
    private medicineService: MedicineService,
    private storeService: StoreService,
    private clientService: ClientsService,
    private inventoryService: InventoryService,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.getResources();
    this.iniatialize();
  }
  redirect() {
    setTimeout(() => {
      if (this.loading) {
        this.router.navigate(['/timeout']);
      }
    }, 5000);
  }

  getAvailable() {
    console.log('running available');
    const item = this.inventory.find((i) => {
      return i.commodity == this.medicine;
    });
    console.log({ item });
    if (!item) return;
    this.available = this.inventoryService.getAvailable(item);
    console.log(this.available);
  }
  iniatialize() {
    this.loading = true;
    this.message = 'loading resources';
    // this.redirect();
    this.interval = setInterval(() => {
      const isLoading = !(
        this.clients.length &&
        this.medicines.length &&
        this.stores.length
      );
      if (isLoading) {
        return;
      }
      this.stopLoading();
    }, 5);
  }
  stopLoading() {
    this.loading = false;
    this.message = 'uploading......resource not added';
    clearInterval(this.interval);
  }

  getResources() {
    this.getClients();
    this.getMedicines();
    this.getStores();
  }

  getInventoryByStore() {
    this.inventoryService
      .getInventoryByStore(this.prescription.outlet)
      .subscribe((i) => {
        this.inventory = i;
        console.log({ inventory: this.inventory });
      });
  }
  getClients() {
    if (this.clientService.clients.length) {
      this.clients = this.clientService.clients;
      return;
    }
    this.clientService.getClients().subscribe((i) => {
      this.clients = i;
      this.clientService.clients = i;
    });
  }
  getStores() {
    if (this.storeService.stores.length) {
      this.stores = this.storeService.stores;
      return;
    }
    this.storeService.getStores().subscribe((i) => {
      this.stores = i;
      this.storeService.stores = i;
    });
  }
  getMedicines() {
    if (this.medicineService.medicines.length) {
      this.medicines = this.medicineService.medicines;
      return;
    }
    this.medicineService.getMedicines().subscribe((i) => {
      this.medicines = i;
      this.medicineService.medicines = i;
    });
  }

  prescription: {
    client: string;
    outlet: string;
    date?: any;
    items: { quantity: number; commodity: string }[];
  } = {
    client: '',
    outlet: '',
    date: 0,
    items: [],
  };

  delete(i: any) {
    this.payloads = this.payloads.filter((x) => {
      return x != i;
    });
  }
  add() {
    if (!this.requested && !this.medicine.length) return;
    let indexx: number = 0;
    const found = this.payloads.find((i, index) => {
      indexx = index;
      return i.commodity == this.medicine;
    });
    if (!found) {
      this.payloads.splice(0, 0, {
        payload: { quantity: this.requested, client: this.client },
        commodity: this.medicine,
      });
      this.clearForm();
      return;
    }
    this.payloads[indexx].payload.quantity += this.requested;
    this.clearForm();
  }
  clearForm() {
    this.requested = 0;
    this.medicine = '';
  }
  clearPrescription(item: any) {
    if (!item) return;
    this.payloads = this.payloads.filter((i: any) => {
      return i.commodity != item.commodity;
    });
    this.loading = false;
    if (!this.payloads.length) {
      this.dispensed += 1;

      this.uploaded = [];
    }
  }
  dispense() {
    if (!this.payloads.length) return;
    this.loading = true;
    const mypayload = this.payloads.map((i) => {
      return { ...i.payload, commodity: i.commodity };
    });
    this.inventoryService
      .dispense({ store: this.outlet, payload: mypayload })
      .subscribe((i) => {
        if (!i.length) {
          this.loading = false;
          return;
        }
        this.uploaded.splice(0, 0, ...i);
        i.forEach((item: any) => {
          this.clearPrescription(item);
        });
      });
  }
}
