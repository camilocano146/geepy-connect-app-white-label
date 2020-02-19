import { Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { PopoverComponent } from 'src/app/common-components/popover/popover.component';
import { PopoverController, NavController, AlertController, ToastController, ModalController } from '@ionic/angular';
import { LocalStorageService } from 'src/app/services/local-storage/local-storage.service';
import { FormControl, Validators } from '@angular/forms';
import { ItineraryService } from 'src/app/services/itinerary/itinerary.service';
import { SimCardService } from 'src/app/services/sim-card/sim-card.service';
import { User } from 'src/app/models/user/user';
import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { ItineraryModalCreateComponent } from './itinerary-modal-create/itinerary-modal-create.component';
import { ItineraryModalEditComponent } from './itinerary-modal-edit/itinerary-modal-edit.component';

@Component({
  selector: 'app-itinerary',
  templateUrl: './itinerary.page.html',
  styleUrls: ['./itinerary.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ItineraryPage implements OnInit {

  public existsItineraries: number;
  public itinerariesList: any[];
  public currentLang: any;
  public copyFull: any[];
  public auxText: string;

  constructor(
    private popoverController: PopoverController,
    private itineraryService: ItineraryService,
    private toastController: ToastController,
    private translateService: TranslateService,
    private modalController: ModalController,
    private translate: TranslateService
  ) {
    this.existsItineraries = 0;
    this.currentLang = this.translateService.currentLang;
    this.copyFull = [];
  }

  ngOnInit() {
    
  }

  ionViewDidEnter(){
    this.itineraryService.getItineraries().subscribe(res => {
      if (res.status == 200) {
        this.itinerariesList = res.body;
        if (this.itinerariesList.length == 0) {
          this.existsItineraries = 1;
        } else if (this.itinerariesList.length > 0) {
          this.existsItineraries = 2;
        }
      }
    }, err => {
      console.log(err);
      this.presentToastError(this.translate.instant('itinerary.error.no_itineraries'));
    });
  }
    /**
   * Filtro
   */
  applyFilter(filterValue: string) {
    if(filterValue != this.auxText){
      this.auxText = filterValue;
      this.itinerariesList.splice(0, this.itinerariesList.length);
      this.copyFull.forEach(element => {
        this.itinerariesList.push(element);
      });
      let aux = [];
      for (let index = 0; index < this.itinerariesList.length; index++) {
        const element: string = this.itinerariesList[index].sim_card.iccid;
        if (element.includes(filterValue)) {
          aux.push(this.itinerariesList[index]);
        }
      }
      this.itinerariesList = aux;
    }
  }
  /**
   * Abrir modal de ver y editar
   */
  async goToSeeEdit(data){
    const modal = await this.modalController.create({
      component: ItineraryModalEditComponent,
      componentProps: {
        'data': data
      }
    });
    modal.onDidDismiss().then(res => {
      if (res.data == "created") {
        this.ionViewDidEnter();
      }
    }).catch();
    return await modal.present();
  }

  /**
 * Crear itinerario
 */
  async openModalCreate() {
    const modal = await this.modalController.create({
      component: ItineraryModalCreateComponent
    });
    modal.onDidDismiss().then(res => {
      if (res.data == "created") {
        this.ionViewDidEnter();
      }
    }).catch();

    return await modal.present();
  }

  async presentToastError(text: string) {
    const toast = await this.toastController.create({
      message: text,
      duration: 3000,
      color: 'danger'
    });
    toast.present();
  }
  async settingsPopover(ev: any) {
    const popover = await this.popoverController.create({
      component: PopoverComponent,
      event: ev,
      mode: 'ios',
    });
    return await popover.present();
  }
}
