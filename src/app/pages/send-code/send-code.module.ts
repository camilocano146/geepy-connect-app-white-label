import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
/**Material */
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
/** Rutas */
import { SendCodePageRoutingModule } from './send-code-routing.module';

import { SendCodePage } from './send-code.page';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    IonicModule,
    //Traductor
    TranslateModule.forChild(),
    ReactiveFormsModule,
    SendCodePageRoutingModule
  ],
  declarations: [SendCodePage]
})
export class SendCodePageModule {}
