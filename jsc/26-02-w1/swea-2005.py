#  


import copy

N = 3
new_arr = [0]*2
new_arr[0] = 1
new_arr[1] = 1
print('1')
old = [0]*3
for i in range(N):
    new_arr[0] = 1
    new_arr[1] = 1
    

    for i in range(1, N-1):
        new_arr.append(old[i-1] + old[i])
    k = new_arr[1]
    new_arr[1] = new_arr[N-1]
    new_arr[N-1] = k
    print(*new_arr)

    old = copy.deepcopy(new_arr)

