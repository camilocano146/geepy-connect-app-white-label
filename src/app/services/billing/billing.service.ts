import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Payment } from '../../models/payment/payment';
import { Injectable } from '@angular/core';
import { PaymentPaypal } from 'src/app/models/payment/payment-paypal';
@Injectable()
export class BillingService {

    constructor(private http: HttpClient) { }

    //Trae las transcaciones
    getTransactions(): Observable<any> {
        return this.http.get("make_transactions/my_transactions/", { observe: 'response' });
    }
    //Cargar dinero por Stripe
    loadBalance(payment: Payment): Observable<any> {
        return this.http.post<any>("make_transactions/load_balance_app/", payment, { observe: 'response' });
    }
    //Cargar dinero por Paypal
    loadBalancePaypal(paymentPaypal: PaymentPaypal):Observable<any>{
        return this.http.post<any>('make_transactions/load_balance_app_pal/', paymentPaypal, {observe: 'response'});
    }
}