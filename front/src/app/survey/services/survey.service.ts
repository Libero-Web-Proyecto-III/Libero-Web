import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateSurveyDto, SubmitSurveyResponseDto, Survey, SurveyResults, SurveyStatusEnum } from '../models/survey.model';

// # Este bloque tiene como objetivo proveer el servicio de comunicación HTTP entre Angular y los endpoints de encuestas dinámicas en NestJS
@Injectable({
  providedIn: 'root',
})
export class SurveyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/surveys';

  // # Este bloque tiene como objetivo obtener la lista de encuestas filtradas por estado o visibilidad desde la API
  getSurveys(status?: SurveyStatusEnum, isPublic?: boolean): Observable<Survey[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (isPublic !== undefined) params = params.set('isPublic', String(isPublic));

    return this.http.get<Survey[]>(this.apiUrl, { params });
  }

  // # Este bloque tiene como objetivo consultar el detalle completo de una encuesta por su ID
  getSurveyById(id: number): Observable<Survey> {
    return this.http.get<Survey>(`${this.apiUrl}/${id}`);
  }

  // # Este bloque tiene como objetivo enviar la solicitud de creación de una nueva encuesta al servidor backend
  createSurvey(payload: CreateSurveyDto): Observable<Survey> {
    return this.http.post<Survey>(this.apiUrl, payload);
  }

  // # Este bloque tiene como objetivo enviar los cambios de actualización de una encuesta existente
  updateSurvey(id: number, payload: Partial<CreateSurveyDto>): Observable<Survey> {
    return this.http.patch<Survey>(`${this.apiUrl}/${id}`, payload);
  }

  // # Este bloque tiene como objetivo solicitar al backend la eliminación lógica de una encuesta por su ID
  deleteSurvey(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  // # Este bloque tiene como objetivo enviar las respuestas de un usuario o encuestado público a una encuesta específica
  submitResponse(surveyId: number, payload: SubmitSurveyResponseDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${surveyId}/responses`, payload);
  }

  // # Este bloque tiene como objetivo consultar si el usuario autenticado ya ha participado previamente en la encuesta
  getUserStatus(surveyId: number): Observable<{ responded: boolean }> {
    return this.http.get<{ responded: boolean }>(`${this.apiUrl}/${surveyId}/user-status`);
  }

  // # Este bloque tiene como objetivo obtener las estadísticas agregadas y resultados calculados para los administradores
  getSurveyResults(surveyId: number): Observable<SurveyResults> {
    return this.http.get<SurveyResults>(`${this.apiUrl}/${surveyId}/results`);
  }
}
