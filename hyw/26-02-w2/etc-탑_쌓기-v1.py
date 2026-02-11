T = int(input())
for test_num in range(1,1+T):
    N,w1,w2 = map(int,input().split())
    List = sorted(list(map(int,input().split())))
    answer = 0
    for i in range(1,1+ max(w1,w2)):
       answer += i*List.pop()
       if i < min(w1,w2)+1:
            answer += i*List.pop()
    print(f"#{test_num} {answer}")