import { Observable } from 'rxjs';

import { IHasID } from 'dfts-helper';

export interface HasCreate<CreateDTOType, ResponseType extends IHasID<ResponseType['id']>> {
  create$(dto: CreateDTOType): Observable<ResponseType>;
}

export interface HasUpdate<UpdateDTOType extends IHasID<UpdateDTOType['id']>, ResponseType extends IHasID<ResponseType['id']>> {
  update$(dto: UpdateDTOType): Observable<ResponseType>;
}
