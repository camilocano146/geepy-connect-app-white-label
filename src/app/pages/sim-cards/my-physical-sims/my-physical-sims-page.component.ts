import {Component, OnInit, ViewChild} from '@angular/core';
import {LoadingService} from '../../../services/loading/loading.service';
import {LocalStorageService} from '../../../services/local-storage/local-storage.service';
import {SimCardService} from '../../../services/sim-card/sim-card.service';
import {IonContent, IonInfiniteScroll, IonInput, ModalController, NavController, PopoverController, ToastController} from '@ionic/angular';
import {TranslateService} from '@ngx-translate/core';
import {User} from '../../../models/user/user';
import {AppComponent} from '../../../app.component';
import {SimModalImportICCID} from '../sim-modal-import-iccid/sim-modal-import-iccid';
import {SimModalImportONUM} from '../sim-modal-import-onum/sim-modal-import-onum';
import {SimBuyPage} from '../sim-buy-page/sim-buy-page.component';
import {SimModalSeeRealComponent} from '../sim-modal-see-real/sim-modal-see-real.component';
import {PopoverComponent} from '../../../common-components/popover/popover.component';
import {SimModalESimBuy} from '../sim-modal-buy-e-sim/sim-modal-buy.component';

@Component({
  selector: 'app-e-sims',
  templateUrl: './my-physical-sims-page.component.html',
  styleUrls: ['./my-physical-sims-page.component.scss'],
})
export class MyPhysicalSimsPage implements OnInit {
  /**
   * Ususario de la app
   */
  public user: User;
  /**
   * Lista de sims
   */
  public simsList: any[];
  public auxText: string;
  /**
   * Preload de sims
   */
  public preloadSims: boolean;
  public pageSim = 0;
  public limit = 30;
  private nextPage: boolean;
  @ViewChild(IonInfiniteScroll) ionInfiniteScroll: IonInfiniteScroll;
  @ViewChild(IonContent) private content: IonContent;
  private isFilteringForText: boolean;
  private timer: number;

  constructor(private loadingService: LoadingService,
              private localStorageService: LocalStorageService,
              private simCardService: SimCardService,
              public popoverController: PopoverController,
              public modalController: ModalController,
              private toastController: ToastController,
              private navController: NavController,
              private translate: TranslateService
  ) {
    this.preloadSims = false;
    this.simsList = [];
    this.user = this.localStorageService.getStorageUser();
  }

  ngOnInit() {
    if (this.simsList) {
      this.simsList.splice(0, this.simsList.length);
    } else {
      this.simsList = [];
    }
    if (this.ionInfiniteScroll) {
      this.ionInfiniteScroll.complete().then(value => {
        console.log('complete');
      });
      this.ionInfiniteScroll.disabled = false;
    }
    this.pageSim = 0;
    this.nextPage = true;
    this.ionViewDidEnter1();
    if (this.simsList.length === 0) {
      this.content?.scrollToBottom(300);
    }
  }

  ionViewDidEnter1(eventInfiniteScroll?: CustomEvent){
    if (this.nextPage) {
      this.simCardService.getSimCardVoyager(this.user.id, this.pageSim++ * this.limit, this.limit, this.auxText).subscribe(res => {
        console.log(res);
        this.nextPage = !!res.body.next;
        if (this.isFilteringForText) {
          this.simsList = res.body.results;
        } else {
          this.simsList.push(...res.body.results);
        }
        // @ts-ignore
        eventInfiniteScroll?.target?.complete();
        if (!this.nextPage) {
          this.ionInfiniteScroll.disabled = true;
        }
      }, err => {
        this.loadingService.dismissLoading();
        this.presentToastError(this.translate.instant('simcard.error.no_load_sim'));
        // @ts-ignore
        eventInfiniteScroll?.target?.complete();
      });
    }
  }

  /**
   * Filtro
   */
  applyFilter(filterValue: string) {
    if (this.timer) {
      window.clearTimeout(this.timer);
    }
    this.timer = window.setTimeout(() => {
      this.auxText = filterValue;
      this.isFilteringForText = true;
      this.ngOnInit();
    }, AppComponent.timeMillisDelayFilter);
  }

  /**
   * Importar SIMS por ICCID
   */
  async openModalImportICCID() {
    const modal = await this.modalController.create({
      component: SimModalImportICCID
    });
    modal.onDidDismiss().then(res => {
      if (res.data === 'imported') {
        this.ngOnInit();
      }
    }).catch();

    return await modal.present();
  }
  /**
   * Importar SIMS por ONUM
   */
  async openModalImportONUM() {
    const modal = await this.modalController.create({
      component: SimModalImportONUM
    });
    modal.onDidDismiss().then(res => {
      if (res.data === 'imported') {
        this.ngOnInit();
      }
    }).catch();

    return await modal.present();
  }
  /**
   * Settings SIMS
   */
  async openModalSettings(item) {
    localStorage.setItem('sim_current', JSON.stringify(item));
    this.navController.navigateRoot('home/simcards/settings');
  }
  /**
   * Comprar sims
   */
  async openModalBuySims() {
    const modal = await this.modalController.create({
      component: SimBuyPage
    });
    modal.onDidDismiss().then(res => {
    }).catch();
    return await modal.present();
  }
  /**
   * Abre moda para ver sim real
   */
  async openModalSeeRealSim() {
    const modal = await this.modalController.create({
      component: SimModalSeeRealComponent
    });
    modal.onDidDismiss().then(res => {
    }).catch();
    return await modal.present();
  }
  /**
   * Menu
   */
  async settingsPopover(ev: any) {
    const popover = await this.popoverController.create({
      component: PopoverComponent,
      event: ev,
      mode: 'ios',
    });
    return await popover.present();
  }
  async presentToastError(text: string) {
    const toast = await this.toastController.create({
      message: text,
      duration: 3000,
      color: 'danger'
    });
    toast.present();
  }

  goToSims(){
    this.navController.navigateBack('home/simcards');
  }

  async openModalBuyE_Sims() {
    const modal = await this.modalController.create({
      component: SimModalESimBuy
    });
    modal.onDidDismiss().then(res => {
      console.log(res);
      if (res.data === 'purchased') {
        this.ngOnInit();
      }
    }).catch();
    return await modal.present();
  }

  loadMoreData(eventInfiniteScroll: CustomEvent) {
    this.isFilteringForText = false;
    this.ionViewDidEnter1(eventInfiniteScroll);
  }

  rechargeContent(inputFilter: IonInput) {
    inputFilter.value = '';
    this.auxText = '';
    this.ngOnInit();
  }
}
