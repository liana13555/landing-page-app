import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import {
  map,
  switchMap,
  pluck,
  mergeMap,
  filter,
  toArray,
  share,
  tap,
  catchError,
  retry
} from "rxjs/operators";
import { NotificationsService } from "../notifications/notifications.service";
import { API_KEY } from '../../environments/api-keys'

interface OpenWeatherResponse {
  list: {
    dt_txt: string
    main: {
      temp: number
    }
  }[]
}

@Injectable({
  providedIn: 'root'
})
export class ForecastService {
  private url = 'https://api.openweathermap.org/data/2.5/forecast'

  constructor(
    private http: HttpClient,
    private notificationsService: NotificationsService
  ) {}

  getForecast() {
    return this.getCurrentLocation()
      .pipe(
        map(coords => {
          return new HttpParams()
            .set('lat', String(coords.latitude))
            .set('lon', String(coords.longitude))
            .set('units', 'metric')
            .set('appid', API_KEY)
        }),
        switchMap(params => this.http.get<OpenWeatherResponse>(this.url, { params: params })
        ),
        map(value => value.list),
        mergeMap(value => of(...value)),
        filter((value, index) => index % 8 === 0),
        map(value => {
          return {
            dateString: value.dt_txt,
            temp: value.main.temp
          }
        }),
        toArray(), share()
    )
  }

  getCurrentLocation() {
    return new Observable<GeolocationCoordinates>((observer) => {
      window.navigator.geolocation.getCurrentPosition(
        (position) => {
          observer.next(position.coords)
          observer.complete()
        },
        (err) => observer.error(err)
      )
    }).pipe(
      retry(1),
      tap(() => {
        this.notificationsService.addSuccess('Got your location')
      },),
      catchError((err) => {
        // #1 - Handle the error
        this.notificationsService.addError('Failed get your location')

        // #2 - Return a new observable (we can emit value to float throughout the rest of pipeline - emit a default location => coordinates )
        return throwError(err)
      })
    )
  }
}
