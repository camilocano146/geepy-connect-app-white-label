import { Component, OnInit, Input } from '@angular/core';
import { ModalController, ToastController, AlertController } from '@ionic/angular';
import { FormControl, Validators } from '@angular/forms';
import { User } from 'src/app/models/user/user';
import { DatePipe } from '@angular/common';
import { LocalStorageService } from 'src/app/services/local-storage/local-storage.service';
import { ItineraryService } from 'src/app/services/itinerary/itinerary.service';
import { SimCardService } from 'src/app/services/sim-card/sim-card.service';
import { Itinerary } from 'src/app/models/itinerary/itinerary';
import { TranslateService } from '@ngx-translate/core';
import { LoadingService } from 'src/app/services/loading/loading.service';

@Component({
  selector: 'app-itinerary-modal-edit',
  templateUrl: './itinerary-modal-edit.component.html',
  styleUrls: ['./itinerary-modal-edit.component.scss'],
})
export class ItineraryModalEditComponent implements OnInit {
  //---------Paquet
  public currentLang: any;
  @Input() data: any;
  //----------Usuario
  public user: User;
  //----------Pais
  public countriesList: any[];
  public country: FormControl;
  //----------Simcard
  public simsList: any[];
  public simcard: any;
  //----------Fecha
  public minDayToPlanning: any;
  public maxDayToPlanning: any;
  public avaiabletoEdit: boolean;
  public startDate: FormControl;
  public newDate: FormControl;
  //----------Paquetes
  public avaiablePackages: any[];
  public existsPackages: number;
  public packageselected: any;
  public expanded: boolean;
  //----------Preload
  public preload_data: boolean;

  constructor(
    private loadingService: LoadingService,
    private modalController: ModalController,
    private toastController: ToastController,
    private localStorageService: LocalStorageService,
    private itineraryService: ItineraryService,
    private alertController: AlertController,
    private simCardService: SimCardService,
    private translate: TranslateService) {
    this.currentLang = this.translate.currentLang;
    this.user = this.localStorageService.getStorageUser();
    const datePipe = new DatePipe('en-US');
    this.minDayToPlanning = datePipe.transform(new Date(Date.now() + (86400000 * 2)), 'yyyy-MM-dd');
    this.maxDayToPlanning = datePipe.transform(new Date(Date.now() + (86400000 * 365)), 'yyyy-MM-dd');
    this.newDate = new FormControl('', Validators.required);
    this.existsPackages = 0;
    this.preload_data = true;
  }

  ngOnInit() {
    this.loadingService.presentLoading().then(() => {
      this.data.package.activation_fee_eur = +this.data.package.activation_fee_eur + 1;
      this.data.package.activation_fee_usd = +this.data.package.activation_fee_usd + 1;
      this.countriesList = [];
      this.simsList = [];
      this.itineraryService.getCountries().subscribe(res => {
        if (res.status == 200) {
          this.countriesList = res.body;
          this.simCardService.getSimCardVoyagerWithoutReferrals(this.user.id, 0, 100).subscribe(res => {
            if (res.status == 200) {
              this.simsList = res.body.results;
              this.packageselected = this.data.package;
              this.country = new FormControl(this.data.destination.id, Validators.required);
              this.simcard = new FormControl(this.data.sim_card.iccid, Validators.required);
              this.startDate = new FormControl(this.data.activation_date, Validators.required);
              this.preload_data = false;
              this.loadingService.dismissLoading();
            }
          }, err => {
            this.loadingService.dismissLoading();
            this.presentToastError(this.translate.instant('simcard.error.no_load_sim'));
          });
        }

      }, err => {
        console.log(err);
        this.loadingService.dismissLoading();
        this.presentToastError(this.translate.instant('simcard.error.no_countries'));
      });
    });
  }

  save() {
    if (this.newDate.valid) {
      this.loadingService.presentLoading().then( ()=>{
        let itinerary: Itinerary = new Itinerary;
        const datePipe = new DatePipe('en-US');
        itinerary.activation_date = datePipe.transform(this.newDate.value, 'yyyy-MM-dd');
        this.itineraryService.updateItinerary(this.data.id, itinerary).subscribe(res => {
          if (res.status == 202) {
            this.presentToastOk(this.translate.instant('itinerary.edit.edit_ok'));
            this.loadingService.dismissLoading().then(() => {
              this.modalController.dismiss({ action: "saved" });
            });
          }
        }, err => {
          console.log(err);
          this.loadingService.dismissLoading();
          if (err.status == 404 && err.error.detail == "Maximum refund date has expired") {
            this.presentToastError(this.translate.instant('simcard.error.maximum_date'));
          } else {
            this.presentToastError(this.translate.instant('simcard.error.edit_error'));
          }
        });
      });
    }
  }

  cancel() {
    this.presentAlertConfirm();
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

  async presentAlertConfirm() {
    const alert = await this.alertController.create({
      header: this.translate.instant('itinerary.edit.header'),
      message: this.translate.instant('itinerary.edit.text'),
      buttons: [
        {
          text: this.translate.instant('itinerary.edit.btn_yes'),
          handler: () => {
            this.loadingService.presentLoading().then(() => {
              this.itineraryService.cancelItinerary(this.data.id).subscribe(res => {
                if (res.status == 204) {
                  this.presentToastOk(this.translate.instant('itinerary.edit.edit_ok'));
                  this.loadingService.dismissLoading().then(() => {
                    this.modalController.dismiss({ action: "cancel", id: this.data.id });
                  });
                }
              }, err => {
                console.log(err);
                this.loadingService.dismissLoading();
                if (err.status == 404 && err.error.detail == "Maximum refund date has expired") {
                  this.presentToastError(this.translate.instant('simcard.error.maximum_date'));
                }
              });
            });

          }
        }, {
          text: this.translate.instant('itinerary.edit.btn_cancel'),
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {

          }
        }
      ]
    });
    await alert.present();
  }
}
