import { Component, OnInit } from '@angular/core';
import { ToastController, ModalController } from '@ionic/angular';
import { SimCardService } from 'src/app/services/sim-card/sim-card.service';
import { FormControl, Validators } from '@angular/forms';
import { ZonesService } from 'src/app/services/zones/zones.service';
import { ServiceAccountService } from 'src/app/services/service-account/service-account.service';
import { TranslateService } from '@ngx-translate/core';
import { OrderSimsVoyager } from 'src/app/models/order/order';
import { CourierService } from 'src/app/services/courier/courier.service';
import { Global } from 'src/app/models/global/global';
import { Courier } from 'src/app/models/courier/courier';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { LoadingService } from 'src/app/services/loading/loading.service';

@Component({
  selector: 'app-sim-modal-buy',
  templateUrl: './sim-modal-buy.component.html',
  styleUrls: ['./sim-modal-buy.component.scss'],
})
export class SimModalBuy implements OnInit {
  //----Paquetes de sims
  public simsPackages: any[];
  public packageSelected: FormControl;
  //----Pais
  public countriesList: any[];
  public countrySelected: FormControl;
  //----Ciudad
  public city: FormControl;
  //----Dirección
  public address: FormControl;
  //----Telefono
  public phone: FormControl;
  //----Courier
  public courier_list: Courier[];
  public courier_selected: FormControl;
  //----Zip
  public zip: FormControl;
  //----Cuenta de servicio
  public serviceAccountsList: any[];
  public accountSelected: FormControl;
  //----Lenguaje
  public language: string;

  constructor(
    private loadingService: LoadingService,
    private toastController: ToastController,
    private modalController: ModalController,
    private simService: SimCardService,
    private zonesService: ZonesService,
    private serviceAccountService: ServiceAccountService,
    private translate: TranslateService,
    private courierService: CourierService,
    private iab: InAppBrowser
  ) {
    this.packageSelected = new FormControl(null, [Validators.required]);
    this.countrySelected = new FormControl(null, [Validators.required]);
    this.city = new FormControl(null, [Validators.required, Validators.minLength(1), Validators.maxLength(40)]);
    this.address = new FormControl(null, [Validators.required, Validators.minLength(1), Validators.maxLength(50)]);
    this.zip = new FormControl(null, [Validators.required, Validators.minLength(1), Validators.maxLength(50)]);
    this.accountSelected = new FormControl(null, Validators.required);
    this.language = this.translate.currentLang;
    this.phone = new FormControl(null, [Validators.required, Validators.minLength(1), Validators.maxLength(50)]);
    this.courier_selected = new FormControl(null, Validators.required);
  }

  ngOnInit() {
    this.getSimsPackages();
  }


  /**
   * Trae pauetes de sims
   */
  getSimsPackages() {
    this.loadingService.presentLoading().then(() => {
      this.simService.getSimsPackagesVoyager().subscribe(res => {
        if (res.status == 200) {
          this.simsPackages = res.body;
          this.getCountries();
        }
      }, err => {
        this.loadingService.dismissLoading();
        console.log(err);
        this.presentToastError(this.translate.instant('simcard.error.no_sim_packages'))
      });
    });
  }

  /**
   * Trae los paises
   */
  getCountries() {
    this.zonesService.getAvailableCountiresToPurchase().subscribe(res => {
      if (res.status == 200) {
        this.countriesList = res.body;
        this.getServicesAccount();
      }
    }, err => {
      console.log(err);
      this.loadingService.dismissLoading();
      this.presentToastError(this.translate.instant('simcard.error.no_countries'));
    });
  }
  /**
   * Trae las cuentas de servicio
   */
  getServicesAccount() {
    this.serviceAccountService.getServicesAccounts().subscribe(res => {
      if (res.status == 200) {
        this.serviceAccountsList = res.body;
        this.getCouriers();
      }
    }, err => {
      this.loadingService.dismissLoading();
      this.presentToastError(this.translate.instant('simcard.error.services_account'));
    });
  }

  getCouriers() {
    this.courierService.getCouriersByOrg(Global.organization_id).subscribe(res => {
      if (res.status == 200) {
        console.log(res.body);
        this.courier_list = res.body;
        this.loadingService.dismissLoading();
      }
    }, err => {
      this.loadingService.dismissLoading();
      this.presentToastError(this.translate.instant('simcard.data.buy_sims.courier_error'));
    });
  }

  order() {
    if (this.packageSelected.valid && this.countrySelected.valid && this.city.valid && this.address.valid && this.zip.valid && this.phone.valid) {
      this.loadingService.presentLoading().then(() => {
        let order: OrderSimsVoyager = new OrderSimsVoyager (
          this.zip.value,
          this.countrySelected.value.id,
          this.city.value,
          this.address.value,
          this.phone.value,
          this.packageSelected.value.id,
          this.accountSelected.value.id,
          this.courier_selected.value.id
        );
        this.simService.orderSims(order).subscribe(res => {
          if (res.status == 201) {
            this.presentToastOk(this.translate.instant('simcard.data.buy_sims.purcahse_ok'));
            this.loadingService.dismissLoading().then(()=> {
              this.dismiss();
            });
          }
        }, err => {
          console.log(err);
          this.loadingService.dismissLoading();
          if (err.status == 402 && err.error.detail == "Hasn't enough money") {
            this.presentToastError(this.translate.instant("simcard.error.not_enough_money"));
          } else {
            this.presentToastError(this.translate.instant("simcard.error.cannot_buy_package"));
          }
        });
      });
    }
  }
  /**
   * Abrir página del courier
   */
  openWebCourier() {
    var options: string = "location=no,clearcache=yes,clearsessioncache=yes"
    let url = this.courier_selected.value.web_address;
    console.log(url);
    const browser = this.iab.create(url, '_system');
  }
  /**
   * Abrir mapa
   */
  openMap() {
    var options: string = "location=no,clearcache=yes,clearsessioncache=yes"
    let url = this.courier_selected.value.description;
    console.log(url);
    const browser = this.iab.create(url, '_system');
  }

  dismiss() {
    // using the injected ModalController this page
    // can "dismiss" itself and optionally pass back data
    this.modalController.dismiss();
  }
  async presentToastError(text: string) {
    const toast = await this.toastController.create({
      message: text,
      duration: 3000,
      color: 'danger'
    });
    toast.present();
  }
  async presentToastOk(text: string) {
    const toast = await this.toastController.create({
      message: text,
      duration: 3000,
      color: 'success'
    });
    toast.present();
  }
  async presentToastWarning(text: string) {
    const toast = await this.toastController.create({
      message: text,
      duration: 3000,
      color: 'warning'
    });
    toast.present();
  }

}
