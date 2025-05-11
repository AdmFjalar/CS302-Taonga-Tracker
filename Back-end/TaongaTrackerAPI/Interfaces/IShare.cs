namespace TaongaTrackerAPI.Interfaces;

public interface IShare
{
    public Exception? ShareWith(string userId, ref List<string>? sharedWithIds)
    {
        sharedWithIds ??= new List<string>();
            
        if (sharedWithIds.Contains(userId))
        {
            return new InvalidOperationException("User is already shared with this vault item");
        }
        else
        {
            try
            {
                sharedWithIds.Add(userId);
            }
            catch (Exception? e)
            {
                return e;
            }

            return null;
        }
    }

    public Exception? StopSharingWith(string userId, ref List<string>? sharedWithIds)
    {
        if (sharedWithIds == null)
        {
            return new InvalidOperationException("Vault item is not shared with anyone");
        }
        else if (!sharedWithIds.Contains(userId))
        {
            return new InvalidOperationException("User is not shared with this vault item");
        }
        else
        {
            try
            {
                sharedWithIds.Remove(userId);
            }
            catch (Exception? e)
            {
                return e;
            }
        }

        return null;
    }
}