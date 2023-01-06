import { Injectable } from '@angular/core';
import { Subject, Observable } from "rxjs";
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, switchMap, tap } from "rxjs/operators";

interface Article {
  title: string
  url: string
}

interface NewsApiResponse {
  totalResults: number
  articles: Article[]
}

@Injectable({
  providedIn: 'root'
})
export class NewsApiService {
  private url = 'https://newsapi.org/v2/top-headlines'
  private pageSize = 10
  private apiKey = '0b9faf0539694c26bd27af75728923ef'
  private country = 'cz'

  private pagesInput: Subject<number>
  pagesOutput: Observable<Article[]>
  numberOfPages: Subject<number>

  constructor(private http: HttpClient) {
    this.numberOfPages = new Subject()

    this.pagesInput = new Subject()
    this.pagesOutput = this.pagesInput.pipe(
      map(page => {
        return new HttpParams()
          .set('apiKey', this.apiKey)
          .set('country', this.country)
          .set('pageSize', String(this.pageSize))
          .set('page', String(page))
      }),
      switchMap(params => {
        return this.http.get<NewsApiResponse>(this.url, { params })
      }),
      tap(response => {
        const totalPages = Math.ceil(response.totalResults / this.pageSize)
        this.numberOfPages.next(totalPages)
      }),
      map(value => value.articles)
    )
  }

  getPage(page: number) {
    this.pagesInput.next(page)
  }
}
