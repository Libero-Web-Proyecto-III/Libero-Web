import { NotFoundException } from '@nestjs/common';
import { CategoryService } from './category.service';

describe('CategoryService - Prueba Unitaria 5.1 (Categoría inexistente)', () => {
  it('debe lanzar NotFoundException cuando no existe la categoría solicitada', async () => {
    const categoryRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    const service = new CategoryService(categoryRepository as any);

    await expect(service.findOneBy.uuid('categoria-inexistente')).rejects.toThrow(
      new NotFoundException('No se encontró esta categoría'),
    );
    expect(categoryRepository.findOne).toHaveBeenCalledWith({
      where: { uuid: 'categoria-inexistente' },
    });
  });
});
