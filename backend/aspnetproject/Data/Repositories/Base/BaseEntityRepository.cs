using aspnetproject.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace aspnetproject.Data.Repositories.Base;

public class BaseEntityRepository<T> : BaseRepository<T> where T : BaseEntity
{
    public BaseEntityRepository(ApplicationDbContext dbContext) : base(dbContext)
    {
    }
    
    public async Task<T?> GetByIdAsync(int id)
    {
        return await _dbSet.FindAsync(id);
    }
    
    public async Task DeleteWithoutChangeTrackingAsync(int id)
    {
        await DeleteWhereAsync(entity => entity.Id == id);
    }
    
    public async Task<bool> ExistsByIdAsync(int id)
    {
        return await ExistsAsync(entity => entity.Id == id);
    }

    // Counts every row, whatever its state: only the context's own query filters apply.
    public async Task<int> CountAsync()
    {
        return await _dbSet.CountAsync();
    }

    public async Task<int> CountCreatedSinceAsync(DateTime since)
    {
        return await _dbSet.CountAsync(entity => entity.CreatedAt >= since);
    }

    public void ClearTracker()
    {
        _dbContext.ChangeTracker.Clear();
    }
}
