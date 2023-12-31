import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { Medicine } from 'src/app/medicine';
import { MedicineService } from 'src/app/services/medicine.service';
import { of } from 'rxjs';

import { ClientsService } from 'src/app/services/clients.service';

import { InventoryService } from 'src/app/services/inventory.service';

import { Router } from '@angular/router';
import { OrderItem, Stock } from 'src/app/interfaces';
import { OrderService } from 'src/app/services/order.service';
@Component({
  selector: 'app-orders-create',
  templateUrl: './orders-create.component.html',
  styleUrls: ['./orders-create.component.css'],
})
export class OrdersCreateComponent {
  @Output() isLoading = new EventEmitter<boolean>();
  interval!: any;
  message!: string;
  available: number = 0;

  medicines: Medicine[] = [];
  dispensed: number = 0;
  uploaded: any = [];
  stocks: Stock[] = [];
  expiryDate: string = '';
  outlet: string = '';
  // stock item
  stockItem: Stock = {
    commodity: '',
    stock: 0,
    unit: '',
    unit_value: 0,
  };
  payloads: OrderItem[] = [];
  medicine: string = '';
  requested = 0;
  loading: boolean = false;

  constructor(
    private medicineService: MedicineService,
    private orderService: OrderService,
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
  getDate(d: string | undefined) {
    if (!d) return '';
    return new Date(d).toLocaleDateString();
  }
  getAvailable() {
    console.log('running available');
    const item = this.stocks.find((i) => {
      return i.commodity == this.medicine;
    });
    if (!item) return;
    this.stockItem = item;
  }
  iniatialize() {
    this.loading = true;
    this.message = 'loading resources';
    // this.redirect();
    this.interval = setInterval(() => {
      const isLoading = !(this.medicines.length && this.stocks.length);
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
    this.getMedicines();
    this.getStocks();
  }

  getStocks() {
    this.inventoryService.getStock().subscribe((i) => {
      this.stocks = i;
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
    title: string;

    items: { quantity: number; commodity: string; unit: string }[];
  } = {
    title: '',

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
      this.prescription.items.splice(0, 0, {
        quantity: this.requested,
        commodity: this.stockItem.commodity,
        unit: this.stockItem.unit,
      });
      this.clearForm();
      return;
    }
    this.payloads[indexx].quantity += this.requested;
    this.clearForm();
  }
  clearForm() {
    this.requested = 0;
    this.medicine = '';
    this.stockItem = {
      commodity: '',
      stock: 0,
      unit: '',
      unit_value: 0,
    };
  }
  clearPrescription() {
    this.prescription = {
      title: '',
      items: [],
    };
    this.loading = false;
  }
  dispense() {
    if (!this.prescription.items.length) return;
    this.loading = true;

    this.orderService.createOrder(this.prescription).subscribe((i) => {
      if (!i) {
        this.loading = false;
        return;
      }
      this.clearPrescription();
    });
  }
  removeItem(i: OrderItem) {
    this.prescription.items = this.prescription.items.filter((item) => {
      return item != i;
    });
  }
}
